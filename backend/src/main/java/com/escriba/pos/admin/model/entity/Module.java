package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "modules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Module {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(unique = true, nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(name = "is_core")
    private Boolean isCore = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    private Boolean active = true;
}
