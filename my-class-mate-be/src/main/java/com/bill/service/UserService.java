package com.bill.service;

import com.bill.constant.RoleEnum;
import com.bill.exceptionhandler.AppException;
import com.bill.model.StudentProfileDto;
import com.bill.model.UserNameDto;
import com.bill.model.request.CreateUserRequest;
import com.bill.model.request.LoginRequest;
import com.bill.model.request.UpdateUserRequest;
import com.bill.model.response.ImportExcelResponse;
import com.bill.model.response.UserResponse;
import com.bill.repository.IdentityRepository;
import com.bill.repository.StudentProfileRepository;
import com.bill.repository.UserRepository;
import com.bill.repository.entity.StudentProfile;
import com.bill.repository.entity.User;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFRichTextString;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import static com.bill.constant.Constants.PASSWORD_VALUE;
import static com.bill.exceptionhandler.ErrorEnum.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserService {
    StudentProfileRepository studentProfileRepository;
    PasswordEncoder passwordEncoder;
    ModelMapper modelMapper;
    UserRepository userRepository;
    IdentityRepository identityRepository;

    @SneakyThrows
    public UserResponse login(LoginRequest request) {
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ERROR_LOGIN.getCode(), ERROR_LOGIN.getMessage()));

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new AppException(ERROR_USER_DEACTIVATED.getCode(), ERROR_USER_DEACTIVATED.getMessage());
        }

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return mapToUserResponse(user, true);
        } else {
            throw new AppException(ERROR_LOGIN.getCode(), ERROR_LOGIN.getMessage());
        }
    }

    public UserResponse getUser(Long userId, boolean needAllInfo) {
        var user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ERROR_USER_NOT_FOUND.getCode(), ERROR_USER_NOT_FOUND.getMessage()));

        return mapToUserResponse(user, needAllInfo);
    }

    public List<UserResponse> getUsers(RoleEnum role) {
        log.info("getUsers role = {}", role);
        // var users = userRepository.findByIsDeletedFalse();
        var users = userRepository.findAll();
        List<User> filteredUsers = new ArrayList<>(users);

        if (role != null) {
            filteredUsers = users.stream()
                    .filter(user -> role.equals(user.getRole()))
                    .toList();
        }

        var usersResponse = filteredUsers.stream()
                .sorted(Comparator.comparing(User::getId))
                .toList();

        return mapToUserResponse(usersResponse);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        var now = LocalDateTime.now();
        var findUser = userRepository.findByUsername(request.getUsername());
        if (findUser.isEmpty()) {
            var user = modelMapper.map(request, User.class);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setIsDeleted(false);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            user = userRepository.save(user);
            var userId = user.getId();

            createStudent(request.getRole(), request.getStudentNo(), userId, now);

            return mapToUserResponse(user, true);
        } else {
            throw new AppException(ERROR_DUPLICATE_USER_NAME.getCode(), ERROR_DUPLICATE_USER_NAME.getMessage());
        }
    }

    private void createStudent(RoleEnum role, String studentNo, Long userId, LocalDateTime now) {
        if (RoleEnum.STUDENT.equals(role)) {
            if (StringUtils.isBlank(studentNo)) {
                throw new AppException(ERROR_MISSING_STUDENT_NO.getCode(), ERROR_MISSING_STUDENT_NO.getMessage());
            }

            var findStudent = studentProfileRepository.findByStudentNo(studentNo);
            if (findStudent.isEmpty()) {
                var studentProfile = StudentProfile.builder()
                        .studentId(userId)
                        .studentNo(studentNo)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();
                studentProfileRepository.save(studentProfile);
            }
        }
    }

    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest request) {
        var user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ERROR_USER_NOT_FOUND.getCode(), ERROR_USER_NOT_FOUND.getMessage()));
        var now = LocalDateTime.now();

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNameTh(request.getNameTh());
        user.setSurnameTh(request.getSurnameTh());
        user.setNameEn(request.getNameEn());
        user.setSurnameEn(request.getSurnameEn());
        user.setRole(request.getRole());
        user.setEmail(request.getEmail());
        user.setUpdatedAt(now);
        user = userRepository.save(user);

        if (!RoleEnum.STUDENT.equals(request.getRole())) {
            studentProfileRepository.deleteById(userId);
        } else {
            createStudent(request.getRole(), request.getStudentNo(), userId, now);
        }

        return mapToUserResponse(user, true);
    }

    public byte[] exportUsers(RoleEnum role) {
        var users = userRepository.findAll();
        users.sort(Comparator.comparing(User::getId));

        if (role != null) {
            users = users.stream()
                    .filter(user -> role.equals(user.getRole()))
                    .toList();
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("ผู้ใช้งานระบบ");

            // ---------- Header Style (Gray) ----------
            Font normalFont = workbook.createFont();
            normalFont.setBold(true);
            normalFont.setFontHeightInPoints((short) 18);
            normalFont.setColor(IndexedColors.BLACK.getIndex());

            // สร้าง font สีแดง
            Font redFont = workbook.createFont();
            redFont.setBold(true);
            redFont.setFontHeightInPoints((short) 18);
            redFont.setColor(IndexedColors.RED.getIndex());

            CellStyle grayHeaderStyle = workbook.createCellStyle();
            grayHeaderStyle.setFont(normalFont);
            grayHeaderStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            grayHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

// ---------- Header Style (Cyan) ----------
            CellStyle cyanHeaderStyle = workbook.createCellStyle();
            cyanHeaderStyle.setFont(normalFont);
            cyanHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex()); // cyan-ish
            cyanHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ---------- Data Style ----------
            CellStyle dataStyle = workbook.createCellStyle();
            Font dataFont = workbook.createFont();
            dataFont.setFontHeightInPoints((short) 16);
            dataStyle.setFont(dataFont);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "ID ผู้ใช้งาน",
                    "บัญชีผู้ใช้งาน",
                    "ชื่อ (ภาษาไทย)",
                    "นามสกุล (ภาษาไทย)",
                    "ชื่อ (ภาษาอังกฤษ)",
                    "นามสกุล (ภาษาอังกฤษ)",
                    "Email",
                    "ยกเลิกบัญชีผู้ใช้งาน",
                    "บทบาทผู้ใช้งาน",
                    "รหัสนักศึกษา",
                    "ที่อยู่",
                    "เบอร์โทรศัพท์มือถือ",
                    "หมายเหตุ"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                var requiredCols = List.of("บัญชีผู้ใช้งาน", "ชื่อ (ภาษาไทย)", "นามสกุล (ภาษาไทย)", "ชื่อ (ภาษาอังกฤษ)", "นามสกุล (ภาษาอังกฤษ)", "Email", "ยกเลิกบัญชีผู้ใช้งาน", "บทบาทผู้ใช้งาน");
                // ทำให้บาง header มี * สีแดง
                if (requiredCols.contains(headers[i])) {
                    String text = headers[i] + " *";
                    XSSFRichTextString richText = new XSSFRichTextString(text);
                    richText.applyFont(0, headers[i].length(), normalFont);
                    richText.applyFont(headers[i].length(), text.length(), redFont);
                    cell.setCellValue(richText);
                } else {
                    cell.setCellValue(headers[i]);
                }

                if (i < 9) {
                    cell.setCellStyle(grayHeaderStyle); // 9 อันแรก สีเทา
                } else {
                    cell.setCellStyle(cyanHeaderStyle); // 4 อันหลัง สีฟ้า
                }
            }

            // Data rows
            int rowIdx = 1;
            for (User user : users) {
                Row row = sheet.createRow(rowIdx++);
                int col = 0;

                row.createCell(col++).setCellValue(user.getId());
                row.createCell(col++).setCellValue(user.getUsername());
                row.createCell(col++).setCellValue(user.getNameTh());
                row.createCell(col++).setCellValue(user.getSurnameTh());
                row.createCell(col++).setCellValue(user.getNameEn());
                row.createCell(col++).setCellValue(user.getSurnameEn());
                row.createCell(col++).setCellValue(user.getEmail());
                row.createCell(col++).setCellValue(Boolean.TRUE.equals(user.getIsDeleted()) ? "Y" : "N");
                row.createCell(col++).setCellValue(user.getRole().name());

                var sp = studentProfileRepository.findById(user.getId()).orElse(null);
                row.createCell(col++).setCellValue(sp != null ? sp.getStudentNo() : "");
                row.createCell(col++).setCellValue(sp != null ? sp.getAddress() : "");
                row.createCell(col++).setCellValue(sp != null ? sp.getPhoneNumber() : "");
                row.createCell(col++).setCellValue(sp != null ? sp.getRemark() : "");

                // apply data style ทุก cell
                for (int i = 0; i < headers.length; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
            }

            // Auto size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i); // ให้ POI จัดขนาด
                int currentWidth = sheet.getColumnWidth(i);
                // เพิ่ม buffer เผื่ออักษรไทย / string ยาว
                sheet.setColumnWidth(i, (int) (currentWidth * 1.3));
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("cannot export excel", e);
            throw new AppException(ERROR_EXPORT_EXCEL.getCode(), ERROR_EXPORT_EXCEL.getMessage());
        }
    }

    @Transactional
    public ImportExcelResponse importUsers(MultipartFile file) {
        var updatedRow = 0;
        var createdRow = 0;

        try (InputStream in = file.getInputStream(); Workbook workbook = new XSSFWorkbook(in)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() <= 1) {
                throw new AppException(ERROR_IMPORT_BLANK_EXCEL.getCode(), ERROR_IMPORT_BLANK_EXCEL.getMessage());
            }

            for (int i = 1; i < sheet.getPhysicalNumberOfRows(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }

                // อ่านค่าจากแต่ละ Cell (trim แล้ว)
                String userIdStr = getCellValue(row.getCell(0));
                String username = getCellValue(row.getCell(1));
                String nameTh = getCellValue(row.getCell(2));
                String surnameTh = getCellValue(row.getCell(3));
                String nameEn = getCellValue(row.getCell(4));
                String surnameEn = getCellValue(row.getCell(5));
                String email = getCellValue(row.getCell(6));
                String isDeletedStr = getCellValue(row.getCell(7));
                String roleStr = getCellValue(row.getCell(8));
                String studentNo = getCellValue(row.getCell(9));
                String address = getCellValue(row.getCell(10));
                String phone = getCellValue(row.getCell(11));
                String remark = getCellValue(row.getCell(12));

                // ตรวจสอบค่าว่างที่จำเป็น
                if (username.isBlank() || nameTh.isBlank() || surnameTh.isBlank() ||
                        nameEn.isBlank() || surnameEn.isBlank() || email.isBlank() || roleStr.isBlank()) {
                    throw new AppException(ERROR_IMPORT_INVALID_EXCEL.getCode(), "blank field at row = " + (i + 1));
                }

                RoleEnum role = RoleEnum.valueOf(roleStr.trim().toUpperCase());
                boolean isDeleted = "Y".equalsIgnoreCase(isDeletedStr);

                if (userIdStr != null) {
                    updatedRow = getUpdatedRow(userIdStr, username, nameTh, surnameTh, nameEn, surnameEn, email, isDeleted, role, studentNo, address, phone, remark, updatedRow);
                } else {
                    createdRow = getCreatedRow(username, nameTh, surnameTh, nameEn, surnameEn, email, isDeleted, role, studentNo, address, phone, remark, createdRow);
                }
            }

        } catch (IOException e) {
            log.error("cannot import excel", e);
            throw new AppException(ERROR_IMPORT_EXCEL.getCode(), ERROR_IMPORT_EXCEL.getMessage());
        }

        return ImportExcelResponse.builder().updatedRow(updatedRow).createdRow(createdRow).build();
    }

    private int getUpdatedRow(String userIdStr, String username, String nameTh, String surnameTh, String nameEn, String surnameEn, String email, boolean isDeleted, RoleEnum role, String studentNo, String address, String phone, String remark, int updatedRow) {
        // ----- UPDATE -----
        Long userId = Long.valueOf(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ERROR_USER_NOT_FOUND.getCode(), ERROR_USER_NOT_FOUND.getMessage()));

        user.setUsername(username.trim());
        user.setNameTh(nameTh.trim());
        user.setSurnameTh(surnameTh.trim());
        user.setNameEn(nameEn.trim());
        user.setSurnameEn(surnameEn.trim());
        user.setEmail(email.trim());
        user.setIsDeleted(isDeleted);
        user.setRole(role);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        if (role == RoleEnum.STUDENT) {
            if (studentNo.isBlank()) {
                throw new AppException(ERROR_IMPORT_INVALID_EXCEL.getCode(), ERROR_IMPORT_INVALID_EXCEL.getMessage());
            }
            StudentProfile sp = studentProfileRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ERROR_STUDENT_PROFILE_NOT_FOUND.getCode(), ERROR_STUDENT_PROFILE_NOT_FOUND.getMessage()));

            sp.setStudentNo(studentNo);
            sp.setAddress(address);
            sp.setPhoneNumber(phone);
            sp.setRemark(remark);
            sp.setUpdatedAt(LocalDateTime.now());
            studentProfileRepository.save(sp);
        }
        updatedRow++;
        return updatedRow;
    }

    private int getCreatedRow(String username, String nameTh, String surnameTh, String nameEn, String surnameEn, String email, boolean isDeleted, RoleEnum role, String studentNo, String address, String phone, String remark, int createdRow) {
        // ----- INSERT -----
        User user = User.builder()
                .username(username.trim())
                .password(passwordEncoder.encode(PASSWORD_VALUE))
                .nameTh(nameTh.trim())
                .surnameTh(surnameTh.trim())
                .nameEn(nameEn.trim())
                .surnameEn(surnameEn.trim())
                .email(email.trim())
                .isDeleted(isDeleted)
                .role(role)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        if (role == RoleEnum.STUDENT) {
            if (studentNo.isBlank()) {
                throw new AppException(ERROR_IMPORT_INVALID_EXCEL.getCode(), ERROR_IMPORT_INVALID_EXCEL.getMessage());
            }
            StudentProfile sp = StudentProfile.builder()
                    .studentId(user.getId())
                    .studentNo(studentNo)
                    .address(address)
                    .phoneNumber(phone)
                    .remark(remark)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            studentProfileRepository.save(sp);
        }
        createdRow++;
        return createdRow;
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().isBlank() ? null : cell.getStringCellValue().trim();
            case NUMERIC:
                double numericValue = cell.getNumericCellValue();
                if (numericValue == Math.floor(numericValue)) {
                    return String.valueOf((long) numericValue).trim();
                } else {
                    return String.valueOf(numericValue).trim();
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue()).trim();
            case FORMULA:
                return cell.getCellFormula().trim();
            default:
                return null;
        }
    }

    @Transactional
    public UserResponse deleteUser(Long userId) {
        var user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ERROR_USER_NOT_FOUND.getCode(), ERROR_USER_NOT_FOUND.getMessage()));

        user.setIsDeleted(true);
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        return mapToUserResponse(user, true);
    }

    public UserNameDto getFullName(Long userId) {
        var user = getUser(userId, false);
        var fullNameTh = user.getNameTh().concat(" ").concat(user.getSurnameTh());
        var fullNameEn = user.getNameEn().concat(" ").concat(user.getSurnameEn());
        return UserNameDto.builder().fullNameTh(fullNameTh).fullNameEn(fullNameEn).build();
    }

    private UserResponse mapToUserResponse(User user, boolean needAllInfo) {
        var userResponse = modelMapper.map(user, UserResponse.class);
        userResponse.setUserId(user.getId());

        if (needAllInfo) {
            setStudentProfile(user, userResponse);
            setIdentity(user, userResponse);
        }

        return userResponse;
    }

    private List<UserResponse> mapToUserResponse(List<User> users) {
        var response = new ArrayList<UserResponse>();
        for (var user : users) {
            var userResponse = mapToUserResponse(user, true);
            response.add(userResponse);
        }
        return response;
    }

    private void setStudentProfile(User user, UserResponse userResponse) {
        if (RoleEnum.STUDENT.equals(user.getRole())) {
            var studentProfile = studentProfileRepository.findById(user.getId())
                    .orElseThrow(() -> new AppException(ERROR_STUDENT_PROFILE_NOT_FOUND.getCode(), ERROR_STUDENT_PROFILE_NOT_FOUND.getMessage()));
            userResponse.setStudentProfile(modelMapper.map(studentProfile, StudentProfileDto.class));
        }
    }

    private void setIdentity(User user, UserResponse userResponse) {
        var identities = identityRepository.findByUserId(user.getId());
        userResponse.setIsUploadedImage(CollectionUtils.isNotEmpty(identities));
        userResponse.setImageCount(identities.size());
    }
}
