package com.yourfamily;

import org.h2.tools.Server;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class Database {

    // DBeaverからもアクセスできるよう、TCPサーバーとして起動する
    public static void startServer() throws SQLException {
        Server.createTcpServer("-tcpPort", "9092", "-tcpAllowOthers").start();
        System.out.println("H2 TCP Server started on port 9092");
    }

    // アプリ全体で使い回す接続を1つ用意する
    // DB_CLOSE_DELAY=-1 : 最後の接続が切れてもデータを消さない（アプリ稼働中は保持）
    private static final String URL = "jdbc:h2:mem:homecoming;DB_CLOSE_DELAY=-1";

    public static Connection connect() throws SQLException {
        return DriverManager.getConnection(URL, "sa", "");
    }

    // テーブルを作成する（既にあれば何もしない）
    public static void initSchema() throws SQLException {
        try (Connection conn = connect();
             Statement stmt = conn.createStatement()) {

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS schedules (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    member_name VARCHAR(50) NOT NULL,
                    arrival_date DATE NOT NULL,
                    arrival_time TIME NOT NULL,
                    station VARCHAR(100) NOT NULL,
                    memo VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS pickup_responses (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    schedule_id BIGINT NOT NULL,
                    responder_name VARCHAR(50) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
                )
            """);

            System.out.println("Tables created (or already existed)");
        }
    }
}