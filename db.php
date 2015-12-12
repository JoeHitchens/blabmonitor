<?
try {

	header("Content-Type: application/json");

	//require "json.php";

	$data = json_decode($_REQUEST["data"]);

	$user = @$data->user;
	$pass = @$data->pass;

	$dbh = new PDO( "mysql:host=localhost;dbname=$user", $user, $pass);
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	$dbh->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);


	$sql = @$data->sql;
	$args = @$data->args;

	$w = strstr(trim($sql), " ", true);
	if($w == "update" || $w == "delete") {
		$st = $dbh->prepare($sql);
		$st->execute($args);
		$o = new StdClass();
		$o->affected_rows = $st->rowCount();
	}
	else
	if($w == "insert") {
		$st = $dbh->prepare($sql);
		$st->execute($args);
		$o = new StdClass();
		$o->insert_id = 0;
		$o->insert_id = $dbh->lastInsertId();
	}
	else
	if($w == "select") {
		$st = $dbh->prepare($sql);
		$st->execute($args);
		$o = new StdClass();
		$o->records = $st->fetchAll(PDO::FETCH_CLASS);
	}
	else {
		throw new Exception("invalid query: $w");
	}

}
catch(Exception $e) {

	$o = new StdClass();
	$o->error = $e->getMessage();

}

echo json_encode($o);

?>
