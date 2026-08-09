package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RecentActivityResponse {
    private String user;
    private String action;
    private String target;
    private String time;
    private String module;
}
