//
//Copyright (c) 2013, Priologic Software Inc.
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//    * Redistributions of source code must retain the above copyright notice,
//      this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
//LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
//POSSIBILITY OF SUCH DAMAGE.
//
var selfEasyrtcid = "";

function initApp() {
    if( window.localStorage && window.localStorage.easyrtcUserName ) {
        document.getElementById('userName').value = window.localStorage.easyrtcUserName;
    }    
}


function disable(id) {
    document.getElementById(id).disabled = "disabled";
}


function enable(id) {
    document.getElementById(id).disabled = "";
}

var contactedListeners = {};
var nameToIdMap = {};

function connect() {
    easyrtc.enableDebug(false);
    var tempName = document.getElementById('userName').value;
    if(  !easyrtc.isNameValid(tempName)) {
        easyrtc.showError("BAD-USER-NAME", "illegal user name");
        return;
    }
    easyrtc.setUserName(tempName);
    if( window.localStorage && window.localStorage.easyrtcUserName ) {
        window.localStorage.easyrtcUserName = tempName;        
    }  
    console.log("Initializing with username " + tempName);
    easyrtc.setScreenCapture();
    easyrtc.enableAudio(document.getElementById("shareAudio").checked);
    easyrtc.setRoomOccupantListener(function (roomName, otherPeers){
        var peer;
        for(peer in otherPeers ) {
            if( !contactedListeners[peer]) {
                easyrtc.sendDataWS(peer, {
                    sender:true
                });
            }        
        }
        contactedListeners = otherPeers;
    });
    
    easyrtc.setPeerListener(function(peer, msgType, data){});
    
    easyrtc.connect("easyrtc.videoScreen", loginSuccess, loginFailure);
}


function hangup() {
    easyrtc.hangupAll();
    disable('hangupButton');
}


function loginSuccess(easyrtcId) {
    disable("connectButton");
    disable("shareAudio");
    enable("disconnectButton");
    selfEasyrtcid = easyrtcId;
    document.getElementById("iam").innerHTML = "Connected";
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}


function disconnect() {
    document.getElementById("iam").innerHTML = "logged out";
    easyrtc.disconnect();
    enable("shareAudio");
    console.log("disconnecting from server");
    enable("connectButton");
    disable("disconnectButton");
    easyrtc.setVideoObjectSrc(document.getElementById('callerAudio'), "");
}


easyrtc.setStreamAcceptor( function(caller, stream) {
    var audio = document.getElementById('callerAudio');
    easyrtc.setVideoObjectSrc(audio,stream);
    console.log("got audio from " + easyrtc.idToName(caller));
    enable("hangupButton");
});



easyrtc.setOnStreamClosed( function (caller) {
    easyrtc.setVideoObjectSrc(document.getElementById('callerAudio'), "");
    disable("hangupButton");
});


var callerPending = null;

easyrtc.setCallCancelled( function(caller){
    if( caller === callerPending) {
        document.getElementById('acceptCallBox').style.display = "none";
        callerPending = false;
    }
});


easyrtc.setAcceptChecker(function(caller, cb) {
    document.getElementById('acceptCallBox').style.display = "block";
    callerPending = caller;

   document.getElementById('acceptCallLabel').innerHTML = "Accept incoming call from " + easyrtc.idToName(caller) + " ?";

    var acceptTheCall = function(wasAccepted) {
        document.getElementById('acceptCallBox').style.display = "none";
        cb(wasAccepted);
        callerPending = null;
    };
    document.getElementById("callAcceptButton").onclick = function() {
        console.log("accepted the call");
        acceptTheCall(true);
    };
    document.getElementById("callRejectButton").onclick =function() {
        console.log("rejected the call");
        acceptTheCall(false);
    };
} );