package com.bill.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class SummaryAndNotiScheduler {
    SummaryAndNotiService summaryAndNotiService;

    @Scheduled(cron = "${app.scheduler.cron}")
    @Transactional
    public void runScheduler() {
        var now = LocalDateTime.now();
        log.info("Running scheduler at {}", now);
        summaryAndNotiService.runSummary();
    }

}
