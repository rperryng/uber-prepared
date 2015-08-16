package com.example.catherinaxu.uberprepared;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.AsyncTask;
import android.os.Bundle;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.google.gson.GsonBuilder;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;

import java.util.HashMap;
import java.util.Map;


public class UberCancel extends Activity {

    private static String mPhoneNumber;

    private class HttpAsyncCancelTask extends AsyncTask<Void, Void, Boolean> {
        private String URL;
        private String toSend;

        public void GetJsonTask(String URL, String jsonObjSend) {
            this.URL = URL;
            this.toSend = jsonObjSend;
        }

        @Override
        protected Boolean doInBackground(Void... params) {
            Boolean result = false;
            try {
                DefaultHttpClient httpclient = new DefaultHttpClient();
                HttpPost httpPostRequest = new HttpPost(URL);

                StringEntity se;
                se = new StringEntity(toSend);

                // Set HTTP parameters
                httpPostRequest.setEntity(se);
                httpPostRequest.setHeader("Accept", "application/json");
                httpPostRequest.setHeader("Content-type", "application/json");

                HttpResponse response = (HttpResponse) httpclient.execute(httpPostRequest);

                if (response.getStatusLine().getStatusCode() == 200) {
                    result = true;
                } else {
                    result = false;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return result;
        }

        @Override
        protected void onPostExecute(Boolean result) {

            super.onPostExecute(result);

            if (result) {
                Toast.makeText(UberCancel.this, "Success! Uber cancelled.", Toast.LENGTH_SHORT).show();
            }
        }
    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_uber_cancel);

        getActionBar().hide();

        TextView title = (TextView) findViewById(R.id.title);
        Typeface font = Typeface.createFromAsset(getAssets(), "Domelen.ttf");
        title.setTypeface(font);

        Button submit = (Button) findViewById(R.id.submit);
        submit.setTypeface(font);

        TelephonyManager tMgr = (TelephonyManager) UberCancel.this.getApplicationContext().getSystemService(Context.TELEPHONY_SERVICE);
        mPhoneNumber = tMgr.getLine1Number();
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_uber_cancel, menu);
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

    public void onBackPressed() {
    }

    public static String makeJSON() {

        Map<String, String> comment = new HashMap<String, String>();
        comment.put("phone", mPhoneNumber);

        String json = new GsonBuilder().create().toJson(comment, Map.class);
        return json;
    }

    public void submitClicked(View view) {
        Log.d("test", "HELLO");
        HttpAsyncCancelTask task = new HttpAsyncCancelTask();
        task.GetJsonTask("https://9fcb1195.ngrok.io/android/cancel", makeJSON());

        task.execute();
    }
}
