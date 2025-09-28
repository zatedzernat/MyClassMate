package com.bill.model.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ImportStudentToCourseExcelResponse {
    int createdRow;
    List<String> invalidStudentNos;
}
