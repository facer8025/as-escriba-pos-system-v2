package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "admin_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(unique = true, nullable = false, length = 5)
    private String code;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_system")
    private Boolean isSystem = true;
}
