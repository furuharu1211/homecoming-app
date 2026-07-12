package com.yourfamily;

import io.github.cdimascio.dotenv.Dotenv;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class LineNotifier {

    private static final Dotenv dotenv = Dotenv.load();
    private static final String ACCESS_TOKEN = dotenv.get("LINE_CHANNEL_ACCESS_TOKEN");
    private static final String GROUP_ID = dotenv.get("LINE_GROUP_ID");

    private static final String PUSH_API_URL = "https://api.line.me/v2/bot/message/push";

    // メッセージ内の特殊文字(ダブルクォートなど)がJSONを壊さないようにエスケープする
    private static String escapeJson(String text) {
        return text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    public static void sendMessage(String text) {
        try {
            String escapedText = escapeJson(text);

            String jsonBody = """
                {
                    "to": "%s",
                    "messages": [
                        { "type": "text", "text": "%s" }
                    ]
                }
                """.formatted(GROUP_ID, escapedText);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(PUSH_API_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + ACCESS_TOKEN)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("LINE通知: ステータスコード " + response.statusCode());
            if (response.statusCode() != 200) {
                System.out.println("LINE通知エラー内容: " + response.body());
            }

        } catch (Exception e) {
            // 通知に失敗しても、アプリ本体の動作(予定登録など)は止めない
            System.out.println("LINE通知に失敗しました: " + e.getMessage());
        }
    }
}