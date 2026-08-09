package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DianProviderDTO {
    private Integer id;
    private String name;
    private String apiUrl;
    private String authType;
    private Boolean active;
}
