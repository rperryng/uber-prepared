package com.example.catherinaxu.uberprepared;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Toast;


public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
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
        EditText username = (EditText) findViewById(R.id.username);
        String u = username.getText().toString();

        EditText password = (EditText) findViewById(R.id.password);
        String p = password.getText().toString();

        CheckBox savepw = (CheckBox) findViewById(R.id.savepw);

        if (u.equals("") || p.equals("")) {
            Toast.makeText(this, "Please enter a username and password", Toast.LENGTH_SHORT).show();
        }

        //launch authentication sequence with server

        //assume that username and password are accepted
        Intent intent = new Intent(this, RequestUber.class);
        startActivity(intent);

        //if not accepted, will send another toast

        if (savepw.isChecked()) {
            //launch save username and password sequence
        }
    }
}
