<?php
	$SQLUSER = "bedien01_main";
	$SQLPASS = "S4sHmqxqIU";

	$db = new mysqli("localhost", $SQLUSER, $SQLPASS, "bedien01_main");
	//$result = $mysqli->query("SELECT * ");

	// For now, expect auth as base64 encoded username:server:password 
	$username = ($_POST['username']) ? $_POST['username'] : "tijs";
	$server = ($_POST['server']) ? $_POST['server'] : "yyy";
	$auth = ($_POST['auth']) ? $_POST['auth'] : "x";

	echo ("Query input: $username, $server, $auth");

	$statement = $db->prepare("SELECT phoneIp, phoneUser, phonePass, username, server, auth FROM users WHERE username = ? AND server = ? AND auth = ?");

	$statement->bind_param("sss", $username, $server, $auth);

	$statement->execute();
	//$result = $statement->get_result();
	$statement->bind_result($phoneIp, $phoneUser, $phonePass, $username, $server, $auth);

	$statement->fetch();

	echo "Results: $phoneIp, $phoneUser, $phonePass";

	$statement->close();

	//phpinfo();

?>