package com.escriba.pos.admin.controller;

import com.escriba.pos.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminApiController {

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<Map<String, String>>> ping() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "ok", "version", "1.0")));
    }
}
