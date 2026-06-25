package com.escriba.pos.controller;

import com.escriba.pos.dto.request.RegisterUserRequest;
import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.dto.response.UserResponse;
import com.escriba.pos.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(companyId)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(
            @RequestParam String term) {
        return ResponseEntity.ok(ApiResponse.success(userService.searchUsers(term)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody RegisterUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Usuario actualizado", userService.updateUser(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(@PathVariable UUID id) {
        userService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Estado cambiado exitosamente", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Usuario eliminado", null));
    }
}
