<?php
	$SQLUSER = "bedien01_main";
	$SQLPASS = "S4sHmqxqIU";

	$db = new mysqli("localhost", $SQLUSER, $SQLPASS, "bedien01_main");

	// For now, expect auth as md5 hash of <username>:<server>:<password> string.
	$username = ($_POST['username']) ? $_POST['username'] : "";
	$server = ($_POST['server']) ? $_POST['server'] : "";
	$auth = ($_POST['auth']) ? $_POST['auth'] : "";

	//echo ("Query input: $username, $server, $auth");

	$statement = $db->prepare("SELECT phoneIp, phoneUser, phonePass, username, server, auth FROM users WHERE username = ? AND server = ? AND auth = ?");
	$statement->bind_param("sss", $username, $server, $auth);
	$statement->execute();
	$statement->bind_result($phoneIp, $phoneUser, $phonePass, $username, $server, $auth);
	$statement->fetch();

	// For development
	header('Access-Control-Allow-Origin: *');

	if (!$phoneIp) {
		header('HTTP/1.0 403 Forbidden');
	} else {
		$clientData = array('phoneIp' => $phoneIp, 'phoneUser' => $phoneUser, 'phonePass' => $phonePass);
		header('Content-type: application/json');
		echo json_encode($clientData);
	}

	$statement->close();

?>