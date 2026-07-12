package com.yourfamily;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class ScheduleRepository {

    // 全件取得（一覧表示用）
    public List<Schedule> findAll() throws SQLException {
        String sql = "SELECT * FROM schedules ORDER BY arrival_date, arrival_time";
        List<Schedule> result = new ArrayList<>();

        try (Connection conn = Database.connect();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                result.add(mapRow(rs));
            }
        }
        return result;
    }

    // 新規登録
    public Schedule save(Schedule schedule) throws SQLException {
        String sql = """
            INSERT INTO schedules (member_name, arrival_date, arrival_time, station, memo)
            VALUES (?, ?, ?, ?, ?)
        """;

        try (Connection conn = Database.connect();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, schedule.memberName);
            stmt.setDate(2, Date.valueOf(schedule.arrivalDate));
            stmt.setTime(3, Time.valueOf(schedule.arrivalTime));
            stmt.setString(4, schedule.station);
            stmt.setString(5, schedule.memo);

            stmt.executeUpdate();

            // 自動採番されたIDを取得して、Javaオブジェクトにも反映させる
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    schedule.id = keys.getLong(1);
                }
            }
        }
        return schedule;
    }

    // DBの1行（ResultSet）を、Javaの Schedule オブジェクトに変換する
    private Schedule mapRow(ResultSet rs) throws SQLException {
        Schedule s = new Schedule();
        s.id = rs.getLong("id");
        s.memberName = rs.getString("member_name");
        s.arrivalDate = rs.getDate("arrival_date").toLocalDate();
        s.arrivalTime = rs.getTime("arrival_time").toLocalTime();
        s.station = rs.getString("station");
        s.memo = rs.getString("memo");
        s.createdAt = rs.getTimestamp("created_at").toLocalDateTime();
        return s;
    }
}