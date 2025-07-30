package com.max.messenger.freeapp.maxmessenger

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView
import android.text.method.LinkMovementMethod
import android.text.util.Linkify

class DetailsActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_details)

        val details = findViewById<TextView>(R.id.detailsText)
        details.text = "Приложение MAX содержит вредоносные компоненты, запрашивает чрезмерные разрешения и отслеживает активность пользователя. Подробнее: https://github.com/ZolManStaff/MAX-deep-analysis-of-the-messenger"
        Linkify.addLinks(details, Linkify.WEB_URLS)
        details.movementMethod = LinkMovementMethod.getInstance()
    }
}
