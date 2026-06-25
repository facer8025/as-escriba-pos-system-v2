package com.escriba.pos.service;

import com.escriba.pos.dto.request.RegisterUserRequest;
import com.escriba.pos.dto.response.UserResponse;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.User;
import com.escriba.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers(UUID companyId) {
        return userRepository.findByCompanyId(companyId).stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, RegisterUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        if (request.getRoleId() != null) {
            user.setRoleId(request.getRoleId());
        }

        user = userRepository.save(user);
        return toUserResponse(user);
    }

    @Transactional
    public void toggleUserStatus(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));
        user.setActive(!user.getActive());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));
        userRepository.delete(user);
    }

    public List<UserResponse> searchUsers(String term) {
        return userRepository.search(term).stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .roleId(user.getRoleId())
                .roleCode(user.getRole().name())
                .roleName(user.getRole().getDisplayName())
                .active(user.getActive())
                .mustChangePassword(user.getMustChangePassword())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
