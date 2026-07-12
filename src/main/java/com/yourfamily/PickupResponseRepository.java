package com.yourfamily;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PickupResponseRepository {

    // 特定の予定(scheduleId)に紐づく回答を一覧取得する
    public List<PickupResponse> findByScheduleId(Long scheduleId) throws SQLException {
        String sql = "SELECT * FROM pickup_responses WHERE schedule_id = ? ORDER BY created_at";
        List<PickupResponse> result = new ArrayList<>();

        try (Connection conn = Database.connect();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, scheduleId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    result.add(mapRow(rs));
                }
            }
        }
        return result;
    }

    // 新規登録（「行けるよ」ボタンを押したときの処理）
    public PickupResponse save(PickupResponse response) throws SQLException {
        String sql = """
            INSERT INTO pickup_responses (schedule_id, responder_name, status)
            VALUES (?, ?, ?)
        """;

        try (Connection conn = Database.connect();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, response.scheduleId);
            stmt.setString(2, response.responderName);
            stmt.setString(3, response.status);

            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    response.id = keys.getLong(1);
                }
            }
        }
        return response;
    }

    // 回答の削除（押し間違いの取り消し用）
    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM pickup_responses WHERE id = ?";

        try (Connection conn = Database.connect();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    // DBの1行を PickupResponse オブジェクトに変換する
    private PickupResponse mapRow(ResultSet rs) throws SQLException {
        PickupResponse r = new PickupResponse();
        r.id = rs.getLong("id");
        r.scheduleId = rs.getLong("schedule_id");
        r.responderName = rs.getString("responder_name");
        r.status = rs.getString("status");
        r.createdAt = rs.getTimestamp("created_at").toLocalDateTime();
        return r;
    }
}