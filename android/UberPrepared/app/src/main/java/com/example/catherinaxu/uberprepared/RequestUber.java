package com.example.catherinaxu.uberprepared;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import com.google.android.gms.maps.model.LatLng;


public class RequestUber extends Activity {
    private static final int NUM_RESULTS = 1;

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
        LatLng myloc;

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
            myloc = getMyLocation();
        }

        //obtain latlng from the destination string
        Geocoder geocoder = new Geocoder(this, Locale.US);
        if (!geocoder.isPresent()) { //what is this error?
            Toast.makeText(this, "Something went wrong. Please try again.", Toast.LENGTH_SHORT).show();
        } else {
            try {
                List<Address> matches = geocoder.getFromLocationName(de, NUM_RESULTS);

                // no results
                if (matches.size() == 0) {
                    Toast.makeText(this, "Destination not found. Please try again.", Toast.LENGTH_SHORT).show();
                } else {
                    AlertDialog.Builder builder = new AlertDialog.Builder(this);

                    // build address
                    String address = "";
                    for (int i = 0; i <= matches.get(0).getMaxAddressLineIndex(); i++) {
                        if (address.equals("")) {
                            address += matches.get(0).getAddressLine(i);
                        } else {
                            address = address + ", " + matches.get(0).getAddressLine(i);
                        }

                    }
                    builder.setMessage("Is this where you want to go? -> " + address)
                            .setCancelable(false)
                            .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int id) {
                                    //launch new activity with stats and update page
                                    dialog.cancel();
                                }
                            })
                            .setNegativeButton("No", new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int id) {
                                    dialog.cancel();
                                }
                            });
                    AlertDialog alert = builder.create();
                    alert.show();
                }

            } catch (IOException exception) {
                Toast.makeText(this, "Something went wrong. Please try again.", Toast.LENGTH_SHORT).show();
            }
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
