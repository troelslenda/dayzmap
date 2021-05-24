import * as Leaflet from 'leaflet';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { isEqual } from 'lodash';
import { runTransaction } from "firebase/firestore";


initializeApp({
  apiKey: "AIzaSyBFAP7NzvuCqBzqja8U7WGvbk4cH6i_8sA",
  authDomain: "dzcolabmap.firebaseapp.com",
  projectId: "dzcolabmap",
  storageBucket: "dzcolabmap.appspot.com",
  messagingSenderId: "194324632272",
  appId: "1:194324632272:web:266f6123b7a426033a84d5",
  measurementId: "G-JQL09SZV7K"
});

const db = getFirestore();

import { getAuth, signInAnonymously } from "firebase/auth";

let uid = null;


const auth = getAuth();

const path = document.location.pathname.slice(1).split('/')[0];

//console.log(path)


const docRef = doc(db, "maps", path);




const mapData = "https://maps.izurvive.com/maps/CH-Top/1.18.0/tiles/{z}/{x}/{y}.png";

let map = new Leaflet.Map(document.querySelector("#mapid"), {
  center: new Leaflet.LatLng(0, 0),
  zoom: 6,
});

Leaflet.tileLayer(mapData,
  {
    tms: true,
    minZoom: 1,
    maxZoom: 7,
    noWrap: true,
    attribution: 'iZurvive.com',
    tileSize: 256,
    bounds: Leaflet.latLngBounds([-85, -180], [85, 180])
  }
).addTo(map);

const blackHelmet = Leaflet.icon({
  iconUrl: "helmet.37361b74.png",
  iconSize: [30, 25], // size of the icon
  iconAnchor: [30, 48],
})


const updatePlayerMarker = async (playerid, latlng) => {
  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        throw "Document does not exist!";
      }

      const players = sfDoc.data()?.players || {};



      players[uid] = {
        pos: { lat: latlng.lat, lng: latlng.lng },
        lastupdate: new Date()
      }
      transaction.update(docRef, { players });
    });
    console.log("Transaction successfully committed!");
  } catch (e) {
    console.log("Transaction failed: ", e);
  }

}

auth.onAuthStateChanged(user => {
  uid = user?.uid;
  if (user === null) {
    signInAnonymously(auth);
  }
})

map.on('click', e => {
  console.log(e.originalEvent.shiftKey)
  
if (e.originalEvent.shiftKey) {
  console.log(map.getBounds(), map.getZoom());
}

    updatePlayerMarker(uid, e.latlng)
  
});

const playerMarkers = {};

onSnapshot(docRef, (doc) => {
  const players = doc.data()?.players;

  if (players) {
    Object.entries(players).forEach(([id, player]: any) => {

      if (playerMarkers[id] === undefined) {
        playerMarkers[id] = new Leaflet.Marker([player.pos.lat, player.pos.lng], { icon: blackHelmet });
        playerMarkers[id].addTo(map);
      }
      if (!isEqual(player.pos, playerMarkers[id].getLatLng())) {
        playerMarkers[id].setLatLng([player.pos.lat, player.pos.lng])
        //var group = new Leaflet.featureGroup(Object.values(playerMarkers));
        //map.fitBounds(group.getBounds());
      }
    });
  }
});

