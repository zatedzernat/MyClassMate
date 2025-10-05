package com.bill.service;

import com.bill.constant.ParticipationStatusEnum;
import com.bill.constant.RoleEnum;
import com.bill.exceptionhandler.AppException;
import com.bill.model.request.CreateParticipationRequest;
import com.bill.model.request.EvaluateParticipationRequest;
import com.bill.model.request.RequestParticipationRequest;
import com.bill.model.response.ParticipationResponse;
import com.bill.model.response.RequestParticipationResponse;
import com.bill.repository.AttendanceRepository;
import com.bill.repository.CourseScheduleRepository;
import com.bill.repository.ParticipationRepository;
import com.bill.repository.ParticipationRequestRepository;
import com.bill.repository.entity.Participation;
import com.bill.repository.entity.ParticipationRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.bill.exceptionhandler.ErrorEnum.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ParticipationService {
    ModelMapper modelMapper;
    UserService userService;
    StudentProfileService studentProfileService;
    AttendanceRepository attendanceRepository;
    CourseScheduleRepository courseScheduleRepository;
    ParticipationRepository participationRepository;
    ParticipationRequestRepository participationRequestRepository;

    @Transactional
    public ParticipationResponse createParticipation(CreateParticipationRequest request) {
        var courseScheduleId = request.getCourseScheduleId();
        // validate courseScheduleId
        courseScheduleRepository.findById(courseScheduleId)
                .orElseThrow(() -> new AppException(
                        ERROR_SCHEDULE_NOT_FOUND.getCode(),
                        ERROR_SCHEDULE_NOT_FOUND.format(courseScheduleId)
                ));

        // validate lecturerId
        var user = userService.getUser(request.getLecturerId(), false);
        if (!RoleEnum.LECTURER.equals(user.getRole())) {
            throw new AppException(ERROR_USER_NOT_LECTURER.getCode(), ERROR_USER_NOT_LECTURER.getMessage());
        }

        // get latest round
        var maxRound = participationRepository.findMaxRoundByCourseScheduleId(courseScheduleId);

        var participation = Participation.builder()
                .courseScheduleId(courseScheduleId)
                .round(maxRound + 1)
                .topic(StringUtils.isNotBlank(request.getTopic()) ? request.getTopic() : "-")
                .status(ParticipationStatusEnum.OPEN)
                .createdBy(request.getLecturerId())
                .createdAt(LocalDateTime.now())
                .build();
        participation = participationRepository.save(participation);

        return mapToParticipationResponse(participation);
    }

    @Transactional
    public ParticipationResponse closeParticipation(Long participationId) {
        var participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new AppException(ERROR_PARTICIPATION_NOT_FOUND.getCode(), ERROR_PARTICIPATION_NOT_FOUND.getMessage()));
        participation.setStatus(ParticipationStatusEnum.CLOSE);
        participation.setClosedAt(LocalDateTime.now());
        participation = participationRepository.save(participation);

        return mapToParticipationResponse(participation);
    }

    public List<ParticipationResponse> getOpenParticipations(Long courseScheduleId) {
        var participations = participationRepository.findByCourseScheduleIdAndStatus(courseScheduleId, ParticipationStatusEnum.OPEN);

        return mapToParticipationResponse(participations);
    }

    @Transactional
    public RequestParticipationResponse requestParticipation(RequestParticipationRequest request) {
        var participationId = request.getParticipationId();
        var studentId = request.getStudentId();
        var courseScheduleId = request.getCourseScheduleId();
        var participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new AppException(ERROR_PARTICIPATION_NOT_FOUND.getCode(), ERROR_PARTICIPATION_NOT_FOUND.getMessage()));

        // validate close participation
        if (ParticipationStatusEnum.CLOSE.equals(participation.getStatus())) {
            throw new AppException(ERROR_PARTICIPATION_CLOSED.getCode(), ERROR_PARTICIPATION_CLOSED.getMessage());
        }

        // validate student attendance
        var attendance = attendanceRepository.findFirstByStudentIdAndCourseScheduleIdOrderByIdDesc(studentId, courseScheduleId);
        if (attendance == null) {
            throw new AppException(ERROR_STUDENT_ATTENDANCE_NOT_FOUND.getCode(), ERROR_STUDENT_ATTENDANCE_NOT_FOUND.format(studentId, courseScheduleId));
        }

        // insert only first time
        var participationRequest = participationRequestRepository.findByParticipationIdAndStudentId(participationId, studentId);
        if (participationRequest == null) {
            participationRequest = ParticipationRequest.builder()
                    .participationId(participationId)
                    .studentId(studentId)
                    .createdAt(LocalDateTime.now())
                    .isScored(false)
                    .score(0)
                    .build();

            participationRequest = participationRequestRepository.save(participationRequest);
        }

        return mapToRequestParticipationResponse(participationRequest);
    }

    public List<RequestParticipationResponse> getParticipationRequests(Long participationId) {
        var participationRequests = participationRequestRepository.findByParticipationIdOrderByCreatedAtAsc(participationId);
        var responses = new ArrayList<RequestParticipationResponse>();
        for (var participationRequest : participationRequests) {
            var response = mapToRequestParticipationResponse(participationRequest);
            responses.add(response);
        }
        return responses;
    }

    @Transactional
    public void evaluateParticipationRequest(EvaluateParticipationRequest request) {
        var participationRequests = new ArrayList<ParticipationRequest>();
        for (var evaluate : request.getEvaluates()) {
            var participationRequestId = evaluate.getParticipationRequestId();
            var participationRequest = participationRequestRepository.findById(participationRequestId)
                    .orElseThrow(() -> new AppException(ERROR_PARTICIPATION_REQUEST_NOT_FOUND.getCode(), ERROR_PARTICIPATION_REQUEST_NOT_FOUND.format(participationRequestId)));

            if (Boolean.FALSE.equals(participationRequest.getIsScored())) {
                var score = evaluate.getScore();
                log.info("evaluateParticipationRequest participationRequestId = {}, score = {}", participationRequestId, score);
                participationRequest.setScore(score);
                participationRequest.setIsScored(true);
                participationRequests.add(participationRequest);
            } else {
                log.info("evaluateParticipationRequest participationRequestId = {} has score already", participationRequestId);
            }
        }
        participationRequestRepository.saveAll(participationRequests);
    }

    private ParticipationResponse mapToParticipationResponse(Participation participation) {
        var response = modelMapper.map(participation, ParticipationResponse.class);
        response.setParticipationId(participation.getId());
        return response;
    }

    private List<ParticipationResponse> mapToParticipationResponse(List<Participation> participations) {
        var responses = new ArrayList<ParticipationResponse>();
        for (var participation : participations) {
            var response = mapToParticipationResponse(participation);
            responses.add(response);
        }
        return responses;
    }

    private RequestParticipationResponse mapToRequestParticipationResponse(ParticipationRequest participationRequest) {
        var response = modelMapper.map(participationRequest, RequestParticipationResponse.class);
        response.setParticipationRequestId(participationRequest.getId());
        var studentProfile = studentProfileService.getStudentProfile(participationRequest.getStudentId());
        response.setStudentNo(studentProfile.getStudentNo());
        response.setStudentNameTh(studentProfile.getStudentNameTh());
        response.setStudentNameEn(studentProfile.getStudentNameEn());
        return response;
    }

}
