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
    public String dinnerStatus; // "家で食べる" or "外で食べる" or null
    public LocalDateTime createdAt;

    public Schedule() {
    }

    public Schedule(String memberName, LocalDate arrivalDate, LocalTime arrivalTime, String station, String memo, String dinnerStatus) {
        this.memberName = memberName;
        this.arrivalDate = arrivalDate;
        this.arrivalTime = arrivalTime;
        this.station = station;
        this.memo = memo;
        this.dinnerStatus = dinnerStatus;
    }
}