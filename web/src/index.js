$(document).ready(function () {
  let params = getParam();
  if (params['kind'] !== "list") $("#problem-list").remove();
  if (params['kind'] !== "index") $("#problem-category").remove();
  if (params['kind'] !== "battle") $("#battle-list").remove();
  if (params['kind'] !== "practice") $("#practice-container").remove();
  if (params['kind'] !== "ranking") $("#ranking").remove();
  if (params["kind"] !== "user") $("#user-container").remove();


  let user = params["name"];
  let rivals = params["rivals"];
  $("#user_name_text").val(user);
  $("#rival_text").val(rivals);

  if (params["kind"] === "index") {
    showCategory(user, rivals);
  } else if (params["kind"] === "list") {
    showList(user, rivals, params["trying"] == 1);
  } else if (params["kind"] === "battle") {
    showBattle(user, rivals);
  } else if (params["kind"] === "ranking") {
    showRanking(params["ranking"]);
  } else if (params["kind"] === "user") {
    showUserPage(user);
  } else if (params["kind"] === "practice") {
    showPractice(user, rivals);
  }

  let user_page_link = $("#user-page-link");
  let user_href = user_page_link.attr("href");
  user_page_link.attr("href", user_href + "&name=" + params["name"]);

  let header_link = $("#header-link");
  let header_href = header_link.attr("href");
  header_link.attr("href", header_href + "&name=" + params["name"]);

  // 問題一覧ページでのみ、リストモードのオプションの表示・非表示を切り替えられる
  if (document.getElementById("problem-container") != null) {
    let list_options = $("#list-options");
    if ($("input[name=list]:checked").val() != 1) list_options.hide();

    $("input[name=list]").change(function () {
      if ($("input[name=list]:checked").val() == 1) {
        // 表示
        list_options.show();
      } else {
        // 非表示
        list_options.hide();
      }
    });
  }
});

function showPractice(problems_string, rivals) {
  $("input[name=list]").val(["3"]);

  $.when(
    $.getJSON("./json/problems_simple.json"),
    $.getJSON("/atcoder-api/problems", {
      "user": "",
      "rivals": rivals
    })
  ).done(
    function (json_simple, json_problems) {
      json_simple = json_simple[0];
      json_problems = json_problems[0];

      let problem_ids = problems_string.split(",");
      let problems = {};
      json_simple.forEach(function (element) {
        if (problems_string.indexOf(element["id"]) != -1) {
          problems[element["id"]] = element;
        }
      });

      let statuses = {};
      let user_set = rivals.split(',');
      json_problems.forEach(function (element) {
        if (problems_string.indexOf(element["id"]) != -1) {
          statuses[element["id"]] = element;
        }
      });

      let header = "<th>#</th>";
      problem_ids.forEach(function (problem_id) {
        if (!(problem_id in problems))return;
        let e = problems[problem_id];
        header += "<th>" +
          "<a href='https://" + e["contest"] + ".contest.atcoder.jp/tasks/" + e["id"] + "' target='_blank'>" +
          e["name"] +
          "</a>" +
          "</th>";
      });
      header = "<thead><tr>" + header + "</tr></thead>";

      let body = "";
      user_set.forEach(function (u) {
        body += "<tr><th scope='row'>" + u + "</th>";
        problem_ids.forEach(function (problem_id) {
          if (!(problem_id in problems))return;
          let e = problems[problem_id];
          let ac = "";
          if (e["id"] in statuses && statuses[e["id"]]["rivals"].indexOf(u) != -1) {
            ac = "<span class='label label-success'>AC</span>";
          }
          body += "<td class='text-center'>" + ac + "</td>";
        });
        body += "</tr>";
      });
      body = "<tbody>" + body + "</tbody>";

      $("#practice-container").append("<table class='table table-sm'>" + header + body + "</table>");
      $("#user_id_label").text("問題ID");
      $("#rival-label").text("ユーザーID");
    }
  ).fail(function () {
    console.log("error");
  });
}

function showCategory(user, rivals) {
  $("input[name=list]").val(["0"]);
  $.when(
    $.getJSON("./json/problems_simple.json"),
    $.getJSON("./json/contests.json"),
    $.getJSON("/atcoder-api/problems", {
      "user": user,
      "rivals": rivals
    })).done(function (json_simple, json_contests, json_problems) {
      json_simple = json_simple[0];
      json_contests = json_contests[0];
      json_problems = json_problems[0];

      let contest_map = {};
      json_contests.forEach(function (contest) {
        contest_map[contest["id"]] = {
          "id": contest["id"],
          "name": contest["name"],
          "start": contest["start"].substring(0, 10),
          "problems": []
        };
      });

      let problems_unified = {};
      json_simple.forEach(function (problem) {
        problems_unified[problem["id"]] = {
          "name": problem["name"],
          "id": problem["id"],
          "contest": problem["contest"],
          "classes": ""
        };
        contest_map[problem["contest"]]["problems"].push(problem["id"]);
      });

      json_problems.forEach(function (problem) {
        problems_unified[problem["id"]]["status"] = problem["status"];
        if (problem["status"] === "AC") {
          problems_unified[problem["id"]]["classes"] = "classes_success";
        } else if (problem["rivals"].length > 0) {
          problems_unified[problem["id"]]["classes"] = "classes_danger";
        } else {
          problems_unified[problem["id"]]["classes"] = "classes_warning";
        }
      });

      let grand = [];
      let beginner = [];
      let regular = [];
      let other = [];
      for (let key in contest_map) {
        let contest = contest_map[key];
        if (key.match(/^agc[0-9]*$/)) {
          contest.problems = contest.problems.sort();
          let ps = [];
          for (let i = 0; i < contest.problems.length; i++) {
            let pu = problems_unified[contest.problems[i]];
            let p_str = "<a href='https://" +
              contest.id + ".contest.atcoder.jp/tasks/" +
              pu.id + "' target='_blank'>" +
              pu.name + "</a><span style='display:none;'>" +
              pu.classes + "</span>";
            ps.push(p_str);
          }
          let row = {
            "contest": "<a href='https://" +
            contest.id + ".contest.atcoder.jp/' target='_blank'>" +
            contest.id.toUpperCase() + "</a>",
            "start": contest.start
          };
          {
            let k = ps.length;
            row["problem_f"] = k > 0 ? ps[--k] : "-";
            row["problem_e"] = k > 0 ? ps[--k] : "-";
            row["problem_d"] = k > 0 ? ps[--k] : "-";
            row["problem_c"] = k > 0 ? ps[--k] : "-";
            row["problem_b"] = k > 0 ? ps[--k] : "-";
            row["problem_a"] = k > 0 ? ps[--k] : "-";
          }
          grand.push(row);

        } else if (key.match(/^a[br]c[0-9]*$/)) {
          contest.problems = contest.problems.sort();
          let ps = [];
          for (let i = 0; i < contest.problems.length; i++) {
            let pu = problems_unified[contest.problems[i]];
            let p_str = "<a href='https://" +
              contest.id + ".contest.atcoder.jp/tasks/" +
              pu.id + "' target='_blank'>" +
              pu.name + "</a><span style='display:none;'>" +
              pu.classes + "</span>";
            ps.push(p_str);
          }
          let row = {
            "contest": "<a href='https://" +
            contest.id + ".contest.atcoder.jp/' target='_blank'>" +
            contest.id.toUpperCase() + "</a>",
            "start": contest.start
          };
          {
            let k = ps.length;
            row["problem_d"] = k > 0 ? ps[--k] : "-";
            row["problem_c"] = k > 0 ? ps[--k] : "-";
            row["problem_b"] = k > 0 ? ps[--k] : "-";
            row["problem_a"] = k > 0 ? ps[--k] : "-";
          }

          if (key.indexOf("abc") != -1)
            beginner.push(row);
          else
            regular.push(row);
        } else {
          contest.problems = contest.problems.sort(function (a, b) {
            let problem_a = problems_unified[a];
            let problem_b = problems_unified[b];
            if (problem_a.name < problem_b.name) return -1;
            if (problem_a.name > problem_b.name) return 1;
            return 0;
          });
          let header = "<strong>" + contest.start + " <a target='_blank' href='http://" + contest.id +
            ".contest.atcoder.jp/'>" + contest.name + "</a></strong>";

          let table = "<table class='table table-bordered'><tbody><tr>";
          for (let i = 0; i < contest.problems.length; i++) {
            let problem = problems_unified[contest.problems[i]];
            let classes = "";
            if (problem.classes == "classes_success") {
              classes = "success";
            } else if (problem.classes == "classes_warning") {
              classes = "warning";
            } else if (problem.classes == "classes_danger") {
              classes = "danger";
            }
            table += "<td class='" +
              classes +
              "'>" +
              "<a href='http://" +
              contest.id +
              ".contest.atcoder.jp/tasks/" +
              problem.id +
              "' target='_blank'>" +
              problem.name +
              "</a>" +
              "</td>";
          }
          table += "</tr></tbody></table>";
          other.push({
            "header": header,
            "table": table,
            "start": contest.start
          });
        }
      }

      grand.sort(function (a, b) {
        if (a.start > b.start) return -1;
        if (a.start < b.start) return 1;
        return 0;
      });
      beginner.sort(function (a, b) {
        if (a.start > b.start) return -1;
        if (a.start < b.start) return 1;
        return 0;
      });
      regular.sort(function (a, b) {
        if (a.start > b.start) return -1;
        if (a.start < b.start) return 1;
        return 0;
      });
      other.sort(function (a, b) {
        if (a.start > b.start) return -1;
        if (a.start < b.start) return 1;
        return 0;
      });
      $("#grand").bootstrapTable("append", grand);
      $("#beginner").bootstrapTable("append", beginner);
      $("#regular").bootstrapTable("append", regular);

      other.forEach(function (element, index, array) {
        let others = $("#others");
        others.append(element.header);
        others.append(element.table);
      });

    }
  ).fail(function () {
    console.log("error");
  });
}

function categoryCellStyle(value, row, index) {
  if (value.indexOf("classes_warning") != -1)
    return {classes: "warning"};
  if (value.indexOf("classes_success") != -1)
    return {classes: "success"};
  if (value.indexOf("classes_danger") != -1)
    return {classes: "danger"};
  return {};
}

function showBattle(user, rivals) {
  $("input[name=list]").val(["2"]);
  $.when(
    $.getJSON("/atcoder-api/results", {
      "user": user,
      "rivals": rivals,
    }),
    $.getJSON("./json/contests.json")
  ).done(function (json_results, json_contests) {
      json_results = json_results[0];
      json_contests = json_contests[0];

      let result_map = {};
      for (let i = 0; i < json_contests.length; i++)
        result_map[json_contests[i].id] = [];
      for (let i = 0; i < json_results.length; i++) {
        let result = json_results[i];
        if (result.contest in result_map)
          result_map[result.contest].push({
            "user": result.user,
            "rank": result.rank
          });
      }

      let rows = [];
      let win_cnt = 0;
      let lose_cnt = 0;
      let draw_cnt = 0;
      for (let i = 0; i < json_contests.length; i++) {
        let contest = json_contests[i];
        let rival = "";
        let rival_rank = 0;
        let my_rank = 0;
        for (let j = 0; j < result_map[contest.id].length; j++) {
          let result = result_map[contest.id][j];
          if (result.user.toLowerCase() === user.toLowerCase()) {
            my_rank = result.rank;
          } else if (rival_rank == 0 || result.rank < rival_rank) {
            rival_rank = result.rank;
            rival = result.user;
          }
        }
        if (result_map[contest.id].length >= 3) {
          rival = rival_rank + " (" + rival + ")";
        } else if (rival_rank > 0) {
          rival = rival_rank + "";
        }

        let result = "";
        if (my_rank > 0 && rival_rank > 0) {
          if (my_rank > rival_rank) {
            result = "LOSE";
            lose_cnt++;
          } else if (my_rank < rival_rank) {
            result = "WIN";
            win_cnt++;
          } else {
            result = "DRAW";
            draw_cnt++;
          }
        }
        if (my_rank === 0) {
          my_rank = "";
        }
        rows.push({
          name: "<a target='_blank' href='http://" + contest.id + ".contest.atcoder.jp/'>" +
          contest.name + "</a>",
          date: contest.start,
          rank: my_rank,
          rival: rival,
          result: result
        });
      }

      rows.sort(function (a, b) {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return 0;
      });
      let $table = $("#battle-result");
      $table.bootstrapTable("append", rows);
      $("#lead-text").text(win_cnt + " 勝 " + lose_cnt + " 敗 " + draw_cnt + " 分");
    }
  ).fail(function () {
    console.log("error");
  });
}

function showList(user, rivals, tryingOnly) {
  // List Mode
  $("input[name=list]").val(["1"]);
  if (tryingOnly) $("input[name=trying]").prop("checked", true);
  $.when(
    $.getJSON("./json/problems.json"),
    $.getJSON("./json/contests.json"),
    $.getJSON("/atcoder-api/problems", {
      "user": user,
      "rivals": rivals,
    })).done(function (json_detailed_problems, json_contests, json_problems) {
    json_detailed_problems = json_detailed_problems[0];
    json_contests = json_contests[0];
    json_problems = json_problems[0];

    let user_result_map = {};
    for (let i = 0; i < json_problems.length; i++) {
      let obj = json_problems[i];
      user_result_map[obj.id] = obj;
    }
    let contest_dict = {};
    for (let i = 0; i < json_contests.length; i++) {
      let contest = json_contests[i];
      contest_dict[contest.id] = contest;
    }

    let rows = [];
    for (let i = 0; i < json_detailed_problems.length; i++) {
      let p = json_detailed_problems[i];
      let status = "";
      let raw_status = "";
      let rival_num = 0;
      if (p.id in user_result_map) {
        let result = user_result_map[p.id];
        raw_status = result.status;
        if (result.status === "AC") {
          if (tryingOnly)continue;
          status = "<div class='text-center'><span class='label label-success'>AC</span></div>";
        } else if (result.rivals.length > 0) {
          for (let j = 0; j < result.rivals.length; j++)
            status += "<div class='text-center'><span class='label label-danger'>" +
              result.rivals[j] + "</span></div>";
        } else if (result.status !== "") {
          status = "<div class='text-center'><span class='label label-warning'>" + result.status + "</span></div>";
        }
        rival_num = result.rivals.length;
      }

      let fastest = "";
      let first = "";
      let shortest = "";
      if (p.source_length > 0) {
        fastest = "<a href='http://";
        if (p.fastest_contest === "")
          p.fastest_contest = p.contest;
        fastest += p.fastest_contest + ".contest.atcoder.jp/submissions/" +
          p.fastest_id + "' target='_blank'>" +
          p.exec_time + " ms <br/>(" +
          p.fastest_user + ")</a>";

        first = "<a href='http://";
        if (p.first_contest === "")
          p.first_contest = p.contest;
        first += p.first_contest + ".contest.atcoder.jp/submissions/" +
          p.first_id + "' target='_blank'>" +
          p.first_user + "</a>";

        shortest = "<a href='http://";
        if (p.shortest_contest === "")
          p.shortest_contest = p.contest;
        shortest += p.shortest_contest + ".contest.atcoder.jp/submissions/" +
          p.shortest_id + "' target='_blank'>" +
          p.source_length + " bytes <br/>(" +
          p.shortest_user + ")</a>";
      }

      let contest_name = contest_dict[p.contest].name;
      if (contest_name.length > 30) {
        contest_name = p.contest.toUpperCase();
      }
      let problem_name = p.name;
      if (problem_name.length > 30) {
        problem_name = problem_name.substring(0, 27) + "...";
      }


      rows.push({
        problem_name_string: p.name,
        problem_name: "<a target='_blank' href='http://" + p.contest + ".contest.atcoder.jp/tasks/" +
        p.id + "'>" + problem_name + "</a>",
        contest_name: "<a href='http://" + p.contest + ".contest.atcoder.jp/' target='_blank'>" +
        contest_name + "</a>",
        status: status,
        solvers: "<a target='_blank' href='http://" + p.contest +
        ".contest.atcoder.jp/submissions/all?task_screen_name=" + p.id + "&status=AC'>" + p.solvers +
        "</a>",
        exec: fastest,
        length: shortest,
        difficulty: p.difficulty,
        date: contest_dict[p.contest].start.substring(0, 10),
        first: first,
        raw_status: raw_status,
        raw_rivals: rival_num
      });
    }
    rows.sort(function (a, b) {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      if (a.contest_name < b.contest_name) return -1;
      if (a.contest_name > b.contest_name) return 1;
      if (a.problem_name_string < b.problem_name_string) return -1;
      if (a.problem_name_string > b.problem_name_string) return 1;
      return 0;
    });
    let $table = $("#all-problems");
    $table.bootstrapTable("append", rows);
  }).fail(function () {
    console.log("error");
  });

}

function showUserPage(user) {
  // User Page
  $("#header-user").text(user);
  $("#problem-container").remove();

  let abc_charts = [];
  let abcs = ["abc_a", "abc_b", "abc_c", "abc_d",];
  for (let i = 0; i < abcs.length; i++) {
    abc_charts.push(c3.generate({
      bindto: "#" + abcs[i] + "_donuts",
      size: {
        height: 200,
        width: 200
      },
      data: {
        columns: [
          ["Accepted", 0],
          ["Trying", 0],
        ],
        type: "pie",
        colors: {
          Accepted: "#32CD32",
          Trying: "#58616A",
        },
        order: null
      },
    }));
  }
  let arc_charts = [];
  let arcs = ["arc_a", "arc_b", "arc_c", "arc_d",];
  for (let i = 0; i < arcs.length; i++) {
    arc_charts.push(c3.generate({
      bindto: "#" + arcs[i] + "_donuts",
      size: {
        height: 200,
        width: 200
      },
      data: {
        columns: [
          ["Accepted", 0],
          ["Trying", 0],
        ],
        type: "pie",
        colors: {
          Accepted: "#32CD32",
          Trying: "#58616A",
        },
        order: null
      }
    }));
  }
  let line_chart = c3.generate({
    bindto: "#user-solved-problems",
    data: {
      x: "x",
      columns: []
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          count: 10,
          format: '%Y-%m-%d'
        }
      }
    }
  });
  let bar_chart = c3.generate({
    bindto: "#user-solved-daily",
    data: {
      x: "x",
      columns: [],
      type: 'bar',
      colors: {
        Accepted: "#32CD32",
      },
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          count: 10,
          format: '%Y-%m-%d'
        }
      }
    },
    bar: {
      width: {
        ratio: 0.02 // this makes bar width 50% of length between ticks
      }
    }
  });

  $.when($.getJSON("/atcoder-api/user", {
    "user": user
  }), $.getJSON("/atcoder-api/problems", {
    "user": user
  })).done(function (user_json, problems_json) {
    user_json = user_json[0];
    problems_json = problems_json[0];
    if (user_json["ac_rank"] === 0) {
      $("#user-contents").remove();
      return;
    }
    $("#ac-num").text(user_json["ac_num"] + " 問");
    $("#short-num").text(user_json["short_num"] + " 問");
    $("#fast-num").text(user_json["fast_num"] + " 問");
    $("#first-num").text(user_json["first_num"] + " 問");

    if (user_json["ac_rank"] > 0) $("#ac-rank").text(user_json["ac_rank"] + " 位");
    if (user_json["short_rank"] > 0) $("#short-rank").text(user_json["short_rank"] + " 位");
    if (user_json["fast_rank"] > 0) $("#fast-rank").text(user_json["fast_rank"] + " 位");
    if (user_json["first_rank"] > 0) $("#first-rank").text(user_json["first_rank"] + " 位");

    for (let i = 0; i < abcs.length; i++) {
      abc_charts[i].load({
        columns: [
          ["Accepted", user_json[abcs[i]]],
          ["Trying", user_json["abc_num"] - user_json[abcs[i]]],
        ]
      });
      $("#" + abcs[i] + "_num").text(user_json[abcs[i]] + "問 / " + user_json["abc_num"] + " 問");
    }

    for (let i = 0; i < arcs.length; i++) {
      let arc_problems_num = user_json["arc_num"];
      // 58th 以降の AtCoder Regular Contest は CD 問題しか存在しない。
      if (i < 2) {
        arc_problems_num = 57;
      }
      arc_charts[i].load({
        columns: [
          ["Accepted", user_json[arcs[i]]],
          ["Trying", arc_problems_num - user_json[arcs[i]]]
        ]
      });
      $("#" + arcs[i] + "_num").text(user_json[arcs[i]] + "問 / " + arc_problems_num + " 問");
    }

    let dateKeys = [];
    for (let i = 0; i < problems_json.length; i++) {
      let date = problems_json[i]["ac_time"];
      if (date.length > 0) {
        let utc_date_str = problems_json[i]["ac_time"];
        utc_date_str = utc_date_str.replace(" ", "T");
        utc_date_str = utc_date_str + "+00:00";
        let dateObject = new Date(utc_date_str);
        let y = dateObject.getFullYear();
        let m = dateObject.getMonth() + 1;
        let d = dateObject.getDate();
        let date_str = y + "-" + ("0" + m).slice(-2) + "-" + ("0" + d).slice(-2);
        dateKeys.push(date_str);
      }
    }
    dateKeys.sort();
    let x_ticks = ["x"];
    let data = ["Accepted"];
    for (let i = 0; i < dateKeys.length; i++) {
      if (i < dateKeys.length - 1 && dateKeys[i] === dateKeys[i + 1]) continue;
      x_ticks.push(dateKeys[i]);
      data.push(i + 1);
    }
    line_chart.load({
      columns: [x_ticks, data]
    });
    for (let i = data.length - 1; i >= 2; i--) data[i] -= data[i - 1];
    bar_chart.load({
      columns: [x_ticks, data]
    });

    let consecutive_ac = 1;
    let max_consecutive = 0;
    for (let i = 2; i < x_ticks.length; i++) {
      let day = new Date(x_ticks[i]);
      let prev = new Date(x_ticks[i - 1]);
      if (prev.getDate() + 1 == day.getDate()) {
        consecutive_ac++;
      } else {
        max_consecutive = Math.max(consecutive_ac, max_consecutive);
        consecutive_ac = 1;
      }
    }
    max_consecutive = Math.max(consecutive_ac, max_consecutive);
    if (x_ticks.length > 1) {
      let last_date = new Date(x_ticks[x_ticks.length - 1]).getDate();
      let today_date = new Date().getDate();
      if (last_date + 1 >= today_date) {
        $("#now-days").text(consecutive_ac + "日");
      } else {
        $("#now-days").text("0日");
      }
      $("#last-date").text("Last AC: " + x_ticks[x_ticks.length - 1]);
    } else {
      $("#now-days").text("0日");
    }
    $("#ac-days").text(max_consecutive + "日");

  }).fail(function () {
    console.log("error");
  });

}

function showRanking(k) {
  // Ranking Mode
  $("#problem-search-block").remove();
  $("#lead-text").remove();

  if (k === "2") {
    k = "short";
    $("#header-title").text("AtCoder コードゴルフランキング");
  } else if (k === "3") {
    k = "fast";
    $("#header-title").text("AtCoder 実行速度ランキング");
  } else if (k === "4") {
    k = "first";
    $("#header-title").text("AtCoder 最速提出ランキング");
  } else {
    k = "ac";
    $("#header-title").text("AtCoder AC 数ランキング");
  }

  $.when($.getJSON("/atcoder-api/ranking", {
    "kind": k
  })).done(function (ranking_json) {
    let rows = [];
    for (let i = 0; i < Math.min(ranking_json.length, 500) && ranking_json[i]["count"] > 0; i++) {
      rows.push({
        rank: ranking_json[i]["rank"],
        user_name: "<a href=" + ranking_json[i]["user_name"] + "'../?kind=list&name='>" +
        ranking_json[i]["user_name"] + "</a>",
        count: ranking_json[i]["count"],
      });
    }
    let $table = $("#all-ranking");
    $table.bootstrapTable("append", rows);
  }).fail(function () {
    console.log("error");
  });
}

function getParam() {
  let paramsArray = {};
  paramsArray["kind"] = "index";
  paramsArray["name"] = "";
  paramsArray["rivals"] = "";
  paramsArray["ranking"] = 0;
  paramsArray["trying"] = 0;

  let url = location.href;
  let parameters = url.split("?");
  if (parameters.length === 1) return paramsArray;

  let splitparams = parameters[1].split("&");
  for (
    let i = 0; i < splitparams.length; i++) {
    let neet = splitparams[i].split("=");
    paramsArray[neet[0]] = neet[1];
  }

  if (url.indexOf("user.php") !== -1) paramsArray["kind"] = "user";
  if (paramsArray["trying"] != 0) paramsArray["trying"] = 1;
  if (paramsArray["list"] == 1 && paramsArray["kind"] === "index") paramsArray["kind"] = "list";
  if (paramsArray["list"] == 2 && paramsArray["kind"] === "index") paramsArray["kind"] = "battle";
  if (paramsArray["list"] == 3 && paramsArray["kind"] === "index") paramsArray["kind"] = "practice";
  if (paramsArray["ranking"] > 0) paramsArray["kind"] = "ranking";
  paramsArray["rivals"] = paramsArray["rivals"].replace(/\%2C/g, ",");
  paramsArray["name"] = paramsArray["name"].replace(/\%2C/g, ",");
  return paramsArray;
}

function battleStyle(row, index) {
  if (row.result === "WIN") {
    return {
      classes: "success"
    };
  } else if (row.result === "LOSE") {
    return {
      classes: "danger"
    };
  } else if (row.result === "DRAW") {
    return {
      classes: "warning"
    };
  } else {
    return {};
  }
}

function listStyle(row, index) {
  if (row.raw_status === "AC") {
    return {
      classes: "success"
    };
  } else if (row.raw_rivals > 0) {
    return {
      classes: "danger"
    };
  } else if (row.raw_status !== "") {
    return {
      classes: "warning"
    };
  } else {
    return {};
  }
}

function numSorter(a, b) {
  a = Number(a.replace(/^.*?<a.*?>([0-9]*).*$/g, "$1"));
  b = Number(b.replace(/^<a.*?>([0-9]*).*$/g, "$1"));
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}