package com.yourfamily;

import java.time.LocalDateTime;

public class PickupResponse {
    public Long id;
    public Long scheduleId;
    public String responderName;
    public String status;
    public LocalDateTime createdAt;

    // JavalinがJSON変換する際に使う、引数なしコンストラクタ
    public PickupResponse() {
    }

    // 新規登録時に使うコンストラクタ
    public PickupResponse(Long scheduleId, String responderName, String status) {
        this.scheduleId = scheduleId;
        this.responderName = responderName;
        this.status = status;
    }
}