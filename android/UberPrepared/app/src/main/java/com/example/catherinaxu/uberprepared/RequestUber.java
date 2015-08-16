package com.example.catherinaxu.uberprepared;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Typeface;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.google.android.gms.maps.model.LatLng;
import com.google.gson.GsonBuilder;

import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;


public class RequestUber extends Activity {
    private static final int NUM_RESULTS = 1;
    private static LatLng mPickupCoords;
    private static LatLng mDestinationCoords;
    private static String mPhoneNumber;
    private static String mHours;
    private static String mMinutes;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_request_uber);
        getActionBar().hide();

        TextView title = (TextView) findViewById(R.id.title);
        Typeface font = Typeface.createFromAsset(getAssets(), "Domelen.ttf");
        title.setTypeface(font);

        Button submit = (Button) findViewById(R.id.submit);
        submit.setTypeface(font);

        EditText hour = (EditText) findViewById(R.id.hour);
        hour.setHint("1");

        EditText minute = (EditText) findViewById(R.id.minute);
        minute.setHint("30");

        //pickup set default with current location
        EditText pickup = (EditText) findViewById(R.id.pickup);
        pickup.setText("Current Location");
        pickup.setHint("Address");

        EditText destination = (EditText) findViewById(R.id.destination);
        destination.setHint("Address");

        TelephonyManager tMgr = (TelephonyManager) RequestUber.this.getApplicationContext().getSystemService(Context.TELEPHONY_SERVICE);
        mPhoneNumber = tMgr.getLine1Number();
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

    public void onBackPressed() {
        Intent intent = new Intent(this, MainActivity.class);
        startActivity(intent);
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

    private void buildSuccessAlert() {
        AlertDialog.Builder builder2 = new AlertDialog.Builder(RequestUber.this);
        builder2.setMessage("Uber booked successfully!");
        AlertDialog alert2 = builder2.create();
        alert2.show();
    }

    private void deployNotification(String message) {
        NotificationCompat.Builder Builder =
                new NotificationCompat.Builder(this)
                        .setSmallIcon(R.drawable.arrow)
                        .setContentTitle("Uber Prepared!")
                        .setContentText(message)
                        .setOngoing(true);

        int NotificationId = 001;

        NotificationManager NotifyMgr =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        NotifyMgr.notify(NotificationId, Builder.build());
    }

    public List<Address> findGeoMatches(String location) {
        Geocoder geocoder = new Geocoder(this, Locale.US);
        List<Address> matches = null;
        //obtain latlng from the destination string
        if (!geocoder.isPresent()) {
            Toast.makeText(this, "Something went wrong. Please try again.", Toast.LENGTH_SHORT).show();
        } else {
            try {
                matches = geocoder.getFromLocationName(location, NUM_RESULTS);

                // no results
                if (matches.size() == 0) {
                    Toast.makeText(this, location + " not found. Please try again.", Toast.LENGTH_SHORT).show();
                } else {
                    return matches;
                }
            } catch (IOException exception) {
                Toast.makeText(this, "Something went wrong. Please try again.", Toast.LENGTH_SHORT).show();
            }
        }
        return matches;
    }

    public String buildAddress(List<Address> matches) {
        String address = "";
        for (int i = 0; i <= matches.get(0).getMaxAddressLineIndex(); i++) {
            if (address.equals("")) {
                address += matches.get(0).getAddressLine(i);
            } else {
                address = address + ", " + matches.get(0).getAddressLine(i);
            }
        }
        return address;
    }

    public static void execute() {
        //get phone


        Map<String, String> comment = new HashMap<String, String>();
        comment.put("phone", mPhoneNumber);
        comment.put("hours", mHours);
        comment.put("minutes", mMinutes);
        comment.put("pickup_lat", String.valueOf(mPickupCoords.latitude));
        comment.put("pickup_lng", String.valueOf(mPickupCoords.longitude));
        comment.put("dest_lat", String.valueOf(mDestinationCoords.latitude));
        comment.put("dest_lng", String.valueOf(mDestinationCoords.longitude));

        String json = new GsonBuilder().create().toJson(comment, Map.class);
        makeRequest("URL", json);
    }

    public static HttpResponse makeRequest(String uri, String json) {
        try {
            HttpPost httpPost = new HttpPost(uri);
            httpPost.setEntity(new StringEntity(json));
            httpPost.setHeader("Accept", "application/json");
            httpPost.setHeader("Content-type", "application/json");
            return new DefaultHttpClient().execute(httpPost);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        } catch (ClientProtocolException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    public void submitClicked(View view) {

        EditText hour = (EditText) findViewById(R.id.hour);
        final String h = hour.getText().toString();
        mHours = h;

        EditText minute = (EditText) findViewById(R.id.minute);
        final String m = minute.getText().toString();
        mMinutes = m;

        EditText pickup = (EditText) findViewById(R.id.pickup);
        final String p = pickup.getText().toString();

        EditText destination = (EditText) findViewById(R.id.destination);
        final String d = destination.getText().toString();

        if (h.equals("") || m.equals("") || p.equals("") || d.equals("")) {
            Toast.makeText(this, "Please enter a value for all of the fields", Toast.LENGTH_SHORT).show();
            return;
        }

        //use curr location
        if (p.equals("Current Location")) {
            mPickupCoords = getMyLocation();
            //confirm destination
            final List<Address> dmatches = findGeoMatches(d);

            //give the user another chance
            if (dmatches == null || dmatches.size() == 0) return;

            AlertDialog.Builder builder2 = new AlertDialog.Builder(RequestUber.this);
            String daddress = buildAddress(dmatches);

            builder2.setMessage("Is " + daddress + " your destination location?")
                    .setCancelable(false)
                    .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int id) {
                            //http post request
                            dialog.cancel();
                            buildSuccessAlert();
                            deployNotification("");

                            mDestinationCoords = new LatLng(dmatches.get(0).getLatitude(), dmatches.get(0).getLongitude());

                        }
                    })
                    .setNegativeButton("No", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int id) {
                            dialog.cancel();
                        }
                    });

                    AlertDialog alert = builder2.create();
                    alert.show();

        //do same for pickup as for dest
        } else {
            final List<Address> pmatches = findGeoMatches(p);

            //give the user another chance
            if (pmatches == null || pmatches.size() == 0) return;

            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            String paddress = buildAddress(pmatches);

            builder.setMessage("Is " + paddress + " your pickup location?")
                   .setCancelable(false)
                   .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int id) {

                            //on fail
                            dialog.cancel();

                            //on success
                            mPickupCoords = new LatLng(pmatches.get(0).getLatitude(), pmatches.get(0).getLongitude());

                            //confirm destination
                            final List<Address> dmatches = findGeoMatches(d);

                            //give the user another chance
                            if (dmatches == null || dmatches.size() == 0) return;

                            AlertDialog.Builder builder2 = new AlertDialog.Builder(RequestUber.this);
                            String daddress = buildAddress(dmatches);

                            builder2.setMessage("Is " + daddress + " your destination location?")
                                    .setCancelable(false)
                                    .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                                        public void onClick(DialogInterface dialog, int id) {

                                            // send HTTP post, and make sure it works

                                            dialog.cancel();
                                            buildSuccessAlert();

                                            deployNotification("");

                                            mDestinationCoords = new LatLng(dmatches.get(0).getLatitude(), dmatches.get(0).getLongitude());
                                        }
                                    })
                                    .setNegativeButton("No", new DialogInterface.OnClickListener() {
                                        public void onClick(DialogInterface dialog, int id) {
                                            dialog.cancel();
                                        }
                                    });

                            AlertDialog alert = builder2.create();
                            alert.show();
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
    }
}
