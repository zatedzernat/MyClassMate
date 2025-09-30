package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.service.SummaryAndNotiService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/v1/summary-noti")
public class SummaryAndNotiController {
    SummaryAndNotiService summaryAndNotiService;

    @RequireRole({RoleEnum.ADMIN})
    @PostMapping(value = "/run")
    public void triggerScheduler() {
        summaryAndNotiService.runSummary();
    }

}
