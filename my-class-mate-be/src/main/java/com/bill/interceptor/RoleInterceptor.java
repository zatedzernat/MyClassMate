package com.bill.interceptor;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.exceptionhandler.AppException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

import static com.bill.exceptionhandler.ErrorEnum.*;

@Component
public class RoleInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod method)) {
            return true;
        }

        RequireRole annotation = method.getMethodAnnotation(RequireRole.class);
        if (annotation == null) {
            return true;
        }

        String roleHeader = request.getHeader("X-Role");
        if (roleHeader == null) {
            throw new AppException(ERROR_MISSING_HEADER_ROLE.getCode(), ERROR_MISSING_HEADER_ROLE.getMessage());
        }

        RoleEnum userRole;
        try {
            userRole = RoleEnum.valueOf(roleHeader.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ERROR_INVALID_ROLE.getCode(), ERROR_INVALID_ROLE.getMessage());
        }

        boolean authorized = Arrays.asList(annotation.value()).contains(userRole);
        if (!authorized) {
            throw new AppException(ERROR_ACCESS_DENIED.getCode(), ERROR_ACCESS_DENIED.getMessage());
        }

        return true;
    }
}
