<?php
    function checkRestAuth($username, $server, $auth) {
        $restServer = str_replace("uc.", "rest.", $server);
        $url = "https://".$restServer."/user";
        $authHeader = "Authorization: Basic " . $auth;

        $ch = curl_init();
        $timeout = 5; // set to zero for no timeout

        curl_setopt ($ch, CURLOPT_URL, $url);
        curl_setopt ($ch, CURLOPT_HTTPHEADER, array($authHeader,  "X-No-Redirect: true"));
        curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout);

        $result = curl_exec($ch);

        return $result;
    }

    // For development
    header('Access-Control-Allow-Origin: *');

	$SQLUSER = "bedien01_main";
	$SQLPASS = "S4sHmqxqIU";

	$db = new mysqli("localhost", $SQLUSER, $SQLPASS, "bedien01_main");

	// For now, expect auth as md5 hash of <username>:<server>:<password> string.
	$username = ($_POST['username']) ? $_POST['username'] : "";
	$server = ($_POST['server']) ? $_POST['server'] : "";
	$auth = ($_POST['auth']) ? $_POST['auth'] : "";

	//echo ("Query input: $username, $server, $auth");

	$statement = $db->prepare("SELECT phoneIp, phoneUser, phonePass, username, server FROM users WHERE username = ? AND server = ?");
	$statement->bind_param("ss", $username, $server);
	$statement->execute();
	$statement->bind_result($phoneIp, $phoneUser, $phonePass, $username, $server);
	$statement->fetch();

    $authRes = false;
    if ($phoneIp) {
        $authRes = checkRestAuth($username, $server, $auth);
    }

	if ($phoneIp && ($authRes != false)) {
		$clientData = array('phoneIp' => $phoneIp, 'phoneUser' => $phoneUser, 'phonePass' => $phonePass);
		header('Content-type: application/json');
		echo json_encode($clientData);
	} else {
	    header('HTTP/1.0 403 Forbidden');
	}

	$statement->close();

?>