<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$user_name = $_GET ["name"];
$user_name = mb_strtolower ( $user_name );

$year = $_GET ["year"];
if (! isset ( $_GET ["year"] ) || $year <= 2011) {
	$year = 2012;
}

$list_mode = $_GET ["list"];
if (! isset ( $_GET ["list"] )) {
	$list_mode = FALSE;
}

$rivals = "";
if (isset ( $_GET ["rivals"] )) {
	$rivals = $_GET ["rivals"];
	$rivals_array = explode ( ',', $rivals );
}

if ($list_mode) {
	$problemArray = getProblemArray ( '/^.*$/', $year, $user_name, $rivals_array );
} else {
	$abcArray = getProblemArray ( '/abc[0-9]*/i', $year, $user_name, $rivals_array );
	$arcArray = getProblemArray ( '/arc[0-9]*/i', $year, $user_name, $rivals_array );
	$allArray = getProblemArray ( '/^(?!.*(abc|arc)).*$/', $year, $user_name, $rivals_array );
}
include 'view/html.inc';
function getProblemArray($pattern, $year, $user_name, $rivals_array) {
	// 正規表現にマッチするコンテストネームの問題集を返す
	// $year以降のコンテストを返す
	$array = array ();
	$sql = new SQLConnect ();
	$pull = $sql->pullContests ();
	
	// コンテスト情報を取得
	foreach ( $pull as $element ) {
		$name = $element ["name"];
		$end = $element ["end"];
		
		if (preg_match ( $pattern, $name ) && strtotime ( $end ) > strtotime ( $year . "/01/01" )) {
			$array [$name] = $element;
		}
	}
	
	// 問題情報を取得
	foreach ( $array as $key => $contest ) {
		$problems = $sql->getProblems ( $contest ["id"] );
		foreach ( $problems as $p ) {
			$problem_name = $p ["name"];
			$array [$key] ["problems"] [$problem_name] = $p;
			$array [$key] ["problems"] [$problem_name] ["solved"] = FALSE;
			$array [$key] ["problems"] [$problem_name] ["rival_solved"] = FALSE;
			$array [$key] ["problems"] [$problem_name] ["rivals"] = "";
		}
	}
	
	// 自分のAC情報を取得
	if (array_key_exists ( "name", $_GET ) && $user_name != "") {
		$solved = $sql->getSolved ( $user_name );
		foreach ( $solved as $sol ) {
			$contest_name = $sol ["contest_name"];
			$problem_name = $sol ["problem_name"];
			if (array_key_exists ( $contest_name, $array ) && array_key_exists ( "problems", $array [$contest_name] )) {
				$array [$contest_name] ["problems"] [$problem_name] ["solved"] = TRUE;
			}
		}
		
		if (count ( $rivals_array ) == 0) {
			return $array;
		}
		
		foreach ( $rivals_array as $rival_name ) {
			if ($rival_name == "") {
				continue;
			}
			$rival_solved = $sql->getSolved ( $rival_name );
			foreach ( $rival_solved as $sol ) {
				$contest_name = $sol ["contest_name"];
				$problem_name = $sol ["problem_name"];
				if (array_key_exists ( $contest_name, $array ) && array_key_exists ( "problems", $array [$contest_name] )) {
					$array [$contest_name] ["problems"] [$problem_name] ["rival_solved"] = TRUE;
					$tmp = $array [$contest_name] ["problems"] [$problem_name] ["rivals"];
					$array [$contest_name] ["problems"] [$problem_name] ["rivals"] = $tmp . "," . $rival_name;
				}
			}
		}
	}
	
	return $array;
}
// 表示する関数
function listupARC($array) {
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		echo '<tr>';
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		// コンテストタイトルを短くする
		$contest_title = str_replace ( "AtCoder Regular Contest", "ARC", $contest_title );
		$contest_title = str_replace ( "AtCoder Beginner Contest", "ABC", $contest_title );
		$contest_title = str_replace ( "#", "", $contest_title );
		
		echo "<td><a href='http://$contest_name.contest.atcoder.jp/'>";
		echo "$contest_title";
		echo "</a></td>";
		
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<td ";
			
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			} elseif ($contest_problem ["rival_solved"]) {
				echo "class='danger'";
			}
			
			echo "><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name'>";
			echo mb_strimwidth ( $contest_problem_title, 0, 30, "...", "UTF-8" );
			// echo $contest_problem_title;
			echo "</a>";
			echo "</td>";
		}
		
		echo '</tr>';
	}
}
function listupAnother($array) {
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		echo '<table class="table table-hover table-striped table-bordered table-condensed">';
		echo '<thead><tr>';
		
		echo date ( "Y-m-d", strtotime ( $contest ["end"] ) );
		echo " <b><a href='http://$contest_name.contest.atcoder.jp/'>";
		echo "$contest_title";
		echo "</a></b>";
		
		echo '</tr></thead>';
		echo '<tbody><tr>';
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<td ";
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			} elseif ($contest_problem ["rival_solved"]) {
				echo "class='danger'";
			}
			echo "><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name'>";
			
			// echo $contest_problem_title;
			if (strstr ( $contest_name, 'joisc2012' )) {
				// joisc2012は多すぎる
				echo mb_strimwidth ( $contest_problem_title, 0, 10, "...", "UTF-8" );
			} else {
				// 30で丸める
				echo mb_strimwidth ( $contest_problem_title, 0, 30, "...", "UTF-8" );
			}
			
			echo "</a>";
			echo "</td>";
		}
		
		echo '</tr></tbody>';
		echo '</table>';
	}
}

/*
 * リストモード
 */
function listMode($array) {
	echo '<table id="example" class="table table-hover table-striped table-bordered table-condensed">';
	echo '<thead><tr>';
	echo '<th>問題名</th>';
	echo '<th>コンテスト</th>';
	echo '<th>状態</th>';
	echo '<th>日付</th>';
	echo '<th>解いた人数</th>';
	echo '</tr></thead>';
	echo '<tbody>';
	
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<tr ";
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			} elseif ($contest_problem ["rival_solved"]) {
				echo "class='danger'";
			}
			echo "><td><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name'>";
			
			// echo $contest_problem_title;
			// if (strstr ( $contest_name, 'joisc2012' )) {
			// // joisc2012は多すぎる
			// echo mb_strimwidth ( $contest_problem_title, 0, 10, "...", "UTF-8" );
			// } else {
			// // 30で丸める
			echo mb_strimwidth ( $contest_problem_title, 0, 40, "...", "UTF-8" );
			// }
			
			echo "</a>";
			echo "</td><td>";
			echo "<a href='http://$contest_name.contest.atcoder.jp/'>";
			echo "$contest_title";
			echo "</a>";
			echo "</td><td>";
			if ($contest_problem ["solved"]) {
				echo '<div class="text-center"><span class="label label-success">AC</span></div>';
			} 
			echo "</td><td>";
			echo date ( "Y-m-d", strtotime ( $contest ["end"] ) );
			echo "</td><td>";
			echo "<div class='text-right'><a href='http://$contest_name.contest.atcoder.jp/submissions/all?task_screen_name=$contest_problem_name&status=AC'>";
			// echo $contest_problem ["solvers"];
			// 4桁まで0埋め
			echo str_pad ( $contest_problem ["solvers"], 4, "0", STR_PAD_LEFT );
			
			echo "</a></div>";
			echo "</td>";
			
			echo "</tr>";
		}
	}
	echo '</tbody>';
	echo '</table>';
}



