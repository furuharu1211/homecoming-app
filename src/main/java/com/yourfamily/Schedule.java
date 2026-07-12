package com.yourfamily;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public class Schedule {
    public Long id;
    public String memberName;
    public LocalDate arrivalDate;
    public LocalTime arrivalTime;
    public String station;
    public String memo;
    public LocalDateTime createdAt;

    // JavalinがJSON変換する際に使う、引数なしコンストラクタ
    public Schedule() {
    }

    // 新規登録時に使うコンストラクタ（idとcreatedAtはDB側で自動生成されるため含めない）
    public Schedule(String memberName, LocalDate arrivalDate, LocalTime arrivalTime, String station, String memo) {
        this.memberName = memberName;
        this.arrivalDate = arrivalDate;
        this.arrivalTime = arrivalTime;
        this.station = station;
        this.memo = memo;
    }
}