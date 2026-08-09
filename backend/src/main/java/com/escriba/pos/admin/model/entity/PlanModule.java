package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "plan_modules", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"plan_id", "module_code"})
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanModule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @Column(name = "module_code", nullable = false, length = 30)
    private String moduleCode;

    @Column(name = "is_included")
    private Boolean isIncluded = true;

    @Column(name = "limit_value")
    private Integer limitValue;

    public Integer getId() { return id; }
    public Plan getPlan() { return plan; }
    public String getModuleCode() { return moduleCode; }
    public Boolean getIsIncluded() { return isIncluded; }
    public Integer getLimitValue() { return limitValue; }

    public void setId(Integer id) { this.id = id; }
    public void setPlan(Plan plan) { this.plan = plan; }
    public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }
    public void setIsIncluded(Boolean isIncluded) { this.isIncluded = isIncluded; }
    public void setLimitValue(Integer limitValue) { this.limitValue = limitValue; }
}
