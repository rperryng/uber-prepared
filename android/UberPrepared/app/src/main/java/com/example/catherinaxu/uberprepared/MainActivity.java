package com.example.catherinaxu.uberprepared;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Toast;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.koushikdutta.ion.Ion;
import com.koushikdutta.ion.bitmap.Transform;
import com.koushikdutta.async.future.Future;
import com.koushikdutta.async.future.FutureCallback;


public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        getActionBar().hide();
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    public void submitClicked(View view) {
        TelephonyManager tMgr = (TelephonyManager) this.getApplicationContext().getSystemService(Context.TELEPHONY_SERVICE);
        String phoneNumber = tMgr.getLine1Number();

        Ion.with(this.getApplicationContext())
                .load("https://9fcb1195.ngrok.io/users/" + phoneNumber)
                .asJsonObject()
                .setCallback(new FutureCallback<JsonObject>() {
                    @Override
                    public void onCompleted(Exception e, JsonObject result) {
                        try {
                            String exists = result.get("exists").toString();

                            if (exists.equals("true")) {
                                Intent intent = new Intent(MainActivity.this, RequestUber.class);
                                startActivity(intent);
                            } else {
                                Intent intent = new Intent(MainActivity.this, WebViewActivity.class);
                                startActivity(intent);
                            }
                        } catch (Exception ex) {
                            Toast.makeText(MainActivity.this, "Something went wrong. Please try again.", Toast.LENGTH_SHORT).show();
                        }
                    }
                });

//      Intent implementation
//      Uri uri = Uri.parse("https://12e819b0.ngrok.io/uber/signup/" + phoneNumber);
//      Intent intent = new Intent(Intent.ACTION_VIEW, uri);
//      startActivity(intent);

    }
}
