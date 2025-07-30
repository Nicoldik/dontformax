package com.max.messenger.freeapp.maxmessenger

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.Button
import android.widget.TextView

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val message = findViewById<TextView>(R.id.messageText)
        message.text = "Приложение MAX было заблокировано антивирусом DR.WEB по причине следящих модулей."

        findViewById<Button>(R.id.detailsButton).setOnClickListener {
            val intent = Intent(this, DetailsActivity::class.java)
            startActivity(intent)
        }

        findViewById<Button>(R.id.closeButton).setOnClickListener {
            finishAffinity()
        }
    }
}
