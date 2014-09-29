<?php
    require_once("../generic.php");
    require_once("lib/vCard.php");

    $contents = null;
    if ($_FILES['uploadedfile']['error'] == UPLOAD_ERR_OK               //checks for errors
          && is_uploaded_file($_FILES['uploadedfile']['tmp_name'])) { //checks that file is uploaded
      $uploadedFileContents = file_get_contents($_FILES['uploadedfile']['tmp_name']);
    }

    if ($uploadedFileContents == null) {
        header('HTTP/1.0 400 Bad Request - File upload failed.');
        exit;
    }

    // Preferably perform the entire import in a single transaction.
    $db->autocommit(false);

    $iperity_company_id = "8271515";

    // MySQL prepared statements
    $delStatement = $db->prepare("DELETE FROM contacts WHERE iperity_company_id=?");
    $contactstatement = $db->prepare("INSERT INTO contacts VALUES (NULL, ?, ?, ?, ?)");
    $numberstatement = $db->prepare("INSERT INTO contact_numbers VALUES (?, ?, ?)");


     // Delete all previous contacts

     $delStatement->bind_param("s", $iperity_company_id);
     $result = $delStatement->execute();

    $vCard = new vCard(false, $uploadedFileContents);
    foreach ($vCard as $vCardPart)
    {
        //print_r($vCardPart);
        //print_r($vCardPart -> n);
        //print_r($vCardPart -> tel);

        $names = $vCardPart -> n [0];
        $firstName = $names[FirstName];
        $lastName = $names[LastName];
        $organisation = $vCardPart -> org[0][Name];
        //echo "For " . $firstName . " " . $lastName . " - " . $organisation . "\n";

        // Insert contacts

        $contactstatement->bind_param("ssss", $firstName, $lastName, $organisation, $iperity_company_id);
        $result = $contactstatement->execute();

        $contactId = $db->insert_id;
        //echo "Contact ID: " . $contactId;

        foreach ($vCardPart -> tel as $number) {
            $num = $number[Value];
            $type = $number[Type][0];

            // Insert numbers
            $numberstatement->bind_param("sss", $contactId, $type, $num);
            $result = $numberstatement->execute();

            /*
            print_r($type);
            echo ":";
            print_r($num);
            echo "\n";
            */
        }
        //echo "\n";
    }


    // Commit
    $db->commit();
?>