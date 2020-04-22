<?php
error_reporting(-1);
header('Content-Type: text/html; charset=utf-8');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
	$from = "hello@honor.su";
	$to = "hello@honor.su";
	$date = date("Y-m-d H:i:s");
	$email = strip_tags($_POST["email"]);
	$subject = strip_tags($_POST["subject"]);
	$message = '
	<html> 
		<head> 
			<title>'. $subject .'</title> 
		</head> 
		<body> 
			<p><label style="display: inline-block; width: 120px; font-weight: bold;"> Дата: </label>'. $date .'</p>
			<p><label style="display: inline-block; width: 120px; font-weight: bold;"> E-Mail: </label>'. $email .'</p>
		</body> 
	</html>'; 
	$headers  = "Content-type: text/html; charset=utf-8 \r\n"; 
	$headers .= "From: {$from}\r\n"; 

	if (mail($to, $subject, $message, $headers)) {
    	$from = "hello@honor.su";
    	$to = $email;
	    $email = strip_tags($_POST["email"]);
        $subject = strip_tags($_POST["subject"]);
    	$message = '
    	<html> 
    		<head> 
    			<title>'. $subject .'</title> 
    		</head> 
    		<body>
    			<p>Спасибо что подписались на HONOR! Следите за новостями и ждите релиза</p>
    		</body> 
    	</html>'; 
    	$headers  = "Content-type: text/html; charset=utf-8 \r\n"; 
    	$headers .= "From: {$from}\r\n";

		if (mail($to, $subject, $message, $headers)) {};
	}; 
}
class MailClass {
	public function sendMail($to, $subject, $message, $headers = "") {
		return mail($to, $subject, $message, $headers); 
	}
}

?>