package com.example.catherinaxu.uberprepared;

import android.app.Activity;
import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import com.google.android.gms.maps.model.LatLng;


public class RequestUber extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_request_uber);

        EditText date = (EditText) findViewById(R.id.date);

        //obtain today's date
        DateFormat dateFormat = new SimpleDateFormat("MM/dd/yy");
        Date today = new Date();
        date.setText(dateFormat.format(today));

        EditText time = (EditText) findViewById(R.id.time);
        time.setHint("Ex: 2:00 PM");

        //pickup set default with current location
        EditText pickup = (EditText) findViewById(R.id.pickup);
        pickup.setText("Current Location");

        EditText destination = (EditText) findViewById(R.id.destination);
        destination.setHint("Destination Address");
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_request_uber, menu);
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
        EditText date = (EditText) findViewById(R.id.date);
        String da = date.getText().toString();

        EditText time = (EditText) findViewById(R.id.time);
        String t = time.getText().toString();

        EditText pickup = (EditText) findViewById(R.id.pickup);
        String p = pickup.getText().toString();

        EditText destination = (EditText) findViewById(R.id.destination);
        String de = destination.getText().toString();

        if (de.equals("") || t.equals("") || p.equals("") || de.equals("")) {
            Toast.makeText(this, "Please enter a value for all of the fields", Toast.LENGTH_SHORT).show();
        }

        if (p.equals("Current Location")) {
            LatLng myloc = getMyLocation();
            Toast.makeText(this, String.valueOf(myloc.latitude) + " " + String.valueOf(myloc.longitude), Toast.LENGTH_SHORT).show();
        }
    }


    /*
    * Returns the user's current location as a LatLng object.
    * Returns null if location could not be found (such as in an AVD emulated virtual device).
    */
    private LatLng getMyLocation() {
        // try to get location three ways: GPS, cell/wifi network, and 'passive' mode
        LocationManager locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        Location loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        if (loc == null) {
            // fall back to network if GPS is not available
            loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
        }
        if (loc == null) {
            // fall back to "passive" location if GPS and network are not available
            loc = locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
        }

        if (loc == null) {
            return null;   // could not get user's location
        } else {
            double myLat = loc.getLatitude();
            double myLng = loc.getLongitude();
            return new LatLng(myLat, myLng);
        }
    }

}
