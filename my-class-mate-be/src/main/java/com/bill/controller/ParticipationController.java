package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.model.request.CreateParticipationRequest;
import com.bill.model.request.EvaluateParticipationRequest;
import com.bill.model.request.RequestParticipationRequest;
import com.bill.model.response.ParticipationResponse;
import com.bill.model.response.RequestParticipationResponse;
import com.bill.service.ParticipationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/v1/participations")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ParticipationController {
    ParticipationService participationService;

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ParticipationResponse createParticipation(@RequestBody @Valid CreateParticipationRequest request) {
        return participationService.createParticipation(request);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PutMapping(value = "/{participationId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ParticipationResponse createParticipation(@PathVariable Long participationId) {
        return participationService.closeParticipation(participationId);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF, RoleEnum.STUDENT})
    @GetMapping(value = "/course-schedule/{courseScheduleId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ParticipationResponse> getParticipations(@PathVariable Long courseScheduleId) {
        return participationService.getParticipations(courseScheduleId);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF, RoleEnum.STUDENT})
    @PostMapping(value = "/requests", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public RequestParticipationResponse requestParticipation(@RequestBody @Valid RequestParticipationRequest request) {
        return participationService.requestParticipation(request);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @GetMapping(value = "/requests/{participationId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<RequestParticipationResponse> getParticipationRequests(@PathVariable Long participationId) {
        return participationService.getParticipationRequests(participationId);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PutMapping(value = "/requests/evaluate", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public void evaluateParticipationRequest(@RequestBody @Valid EvaluateParticipationRequest request) {
        participationService.evaluateParticipationRequest(request);
    }
}
