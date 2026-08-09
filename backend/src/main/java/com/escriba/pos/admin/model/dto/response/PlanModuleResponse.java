package com.escriba.pos.admin.model.dto.response;

public class PlanModuleResponse {
    private final String code;
    private final String name;
    private final boolean isIncluded;
    private final String category;

    public PlanModuleResponse(String code, String name, boolean isIncluded, String category) {
        this.code = code;
        this.name = name;
        this.isIncluded = isIncluded;
        this.category = category;
    }

    private PlanModuleResponse(Builder builder) {
        this(builder.code, builder.name, builder.isIncluded, builder.category);
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getCode() { return code; }
    public String getName() { return name; }
    public boolean isIncluded() { return isIncluded; }
    public String getCategory() { return category; }

    public static class Builder {
        private String code;
        private String name;
        private boolean isIncluded;
        private String category;

        public Builder code(String code) { this.code = code; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder isIncluded(boolean isIncluded) { this.isIncluded = isIncluded; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public PlanModuleResponse build() { return new PlanModuleResponse(this); }
    }
}
