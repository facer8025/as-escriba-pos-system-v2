package com.escriba.pos.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "id_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class IdType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "applies_to", length = 20)
    private String appliesTo;

    @Column(nullable = false)
    private Boolean active = true;
}
