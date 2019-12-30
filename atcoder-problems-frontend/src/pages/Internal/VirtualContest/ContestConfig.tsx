import React, { useState } from "react";
import {
  Button,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  InputGroup,
  Label,
  ListGroup,
  ListGroupItem,
  Row,
  UncontrolledDropdown
} from "reactstrap";
import { Range, Map, List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../../../utils/CachedApiClient";
import { ProblemId } from "../../../interfaces/Status";
import Problem from "../../../interfaces/Problem";
import { formatProblemUrl } from "../../../utils/Url";
import moment from "moment";
import { Redirect } from "react-router-dom";
import { USER_GET } from "../ApiUrl";
import ProblemSearchBox from "../../../components/ProblemSearchBox";
import { formatMode, VirtualContestItem, VirtualContestMode } from "../types";

const ContestConfig = (props: InnerProps) => {
  const [title, setTitle] = useState(props.initialTitle);
  const [memo, setMemo] = useState(props.initialMemo);

  const [startDate, setStartDate] = useState(props.initialStartDate);
  const [startHour, setStartHour] = useState(props.initialStartHour);
  const [startMinute, setStartMinute] = useState(props.initialStartMinute);
  const [endDate, setEndDate] = useState(props.initialEndDate);
  const [endHour, setEndHour] = useState(props.initialEndHour);
  const [endMinute, setEndMinute] = useState(props.initialEndMinute);
  const [problemSet, setProblemSet] = useState(props.initialProblems);
  const [mode, setMode] = useState(props.initialMode);

  if (props.loginState.rejected) {
    return <Redirect to="/" />;
  }

  const { problemMapFetch } = props;
  if (!problemMapFetch.fulfilled) {
    return null;
  }
  const problemMap = problemMapFetch.value;

  const startSecond = toUnixSecond(startDate, startHour, startMinute);
  const endSecond = toUnixSecond(endDate, endHour, endMinute);
  const isValid = title.length > 0 && startSecond <= endSecond;

  return (
    <>
      <Row>
        <h1>{props.pageTitle}</h1>
      </Row>

      <Row className="my-2">
        <Label>Contest Title</Label>
        <Input
          type="text"
          placeholder="Contest Title"
          value={title}
          onChange={event => setTitle(event.target.value)}
        />
      </Row>

      <Row className="my-2">
        <Label>Description</Label>
        <Input
          type="text"
          placeholder="Description"
          value={memo}
          onChange={event => setMemo(event.target.value)}
        />
      </Row>

      <Row className="my-2">
        <Label>Mode</Label>
        <InputGroup>
          <UncontrolledDropdown>
            <DropdownToggle caret>{formatMode(mode)}</DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={() => setMode(null)}>
                {formatMode(null)}
              </DropdownItem>
              <DropdownItem onClick={() => setMode("lockout")}>
                {formatMode("lockout")}
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </InputGroup>
      </Row>

      <Row className="my-2">
        <Label>Start Time</Label>
        <InputGroup>
          <Input
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
          />
          <Input
            type="select"
            value={startHour}
            onChange={e => setStartHour(Number(e.target.value))}
          >
            {Range(0, 24).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
          <Input
            type="select"
            value={startMinute}
            onChange={e => setStartMinute(Number(e.target.value))}
          >
            {Range(0, 60, 5).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
        </InputGroup>
      </Row>

      <Row className="my-2">
        <Label>End Time</Label>
        <InputGroup>
          <Input
            type="date"
            value={endDate}
            onChange={event => setEndDate(event.target.value)}
          />
          <Input
            type="select"
            value={endHour}
            onChange={e => setEndHour(Number(e.target.value))}
          >
            {Range(0, 24).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
          <Input
            type="select"
            value={endMinute}
            onChange={e => setEndMinute(Number(e.target.value))}
          >
            {Range(0, 60, 5).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
        </InputGroup>
      </Row>

      <Row>
        <Label>Problems</Label>
      </Row>

      <Row>
        <Col>
          <ListGroup>
            {problemSet.valueSeq().map((p, i) => {
              const problemId = p.id;
              const problem = problemMap.get(problemId);
              return (
                <ListGroupItem key={problemId}>
                  <Button
                    close
                    onClick={() => {
                      setProblemSet(problemSet.filter(x => x.id !== problemId));
                    }}
                  />
                  {problem ? (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={formatProblemUrl(problem.id, problem.contest_id)}
                    >
                      {problem.title}
                    </a>
                  ) : (
                    problemId
                  )}
                  {mode === "lockout" ? (
                    <Input
                      type="number"
                      value={p.point !== null ? p.point : 0}
                      onChange={e => {
                        const parse = parseInt(e.target.value, 10);
                        const point = !isNaN(parse) ? parse : null;
                        setProblemSet(
                          problemSet.update(i, x => ({
                            ...x,
                            point
                          }))
                        );
                      }}
                    />
                  ) : null}
                </ListGroupItem>
              );
            })}
          </ListGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <ProblemSearchBox
          problems={problemMap.valueSeq().toList()}
          selectProblem={problem => {
            if (problemSet.every(p => p.id !== problem.id)) {
              setProblemSet(
                problemSet.push({ id: problem.id, point: null, order: null })
              );
            }
          }}
        />
      </Row>

      <Row className="my-2">
        <Button
          disabled={!isValid}
          color={isValid ? "success" : "link"}
          onClick={() =>
            props.buttonPush({
              title,
              memo,
              startSecond,
              endSecond,
              problems: problemSet,
              mode
            })
          }
        >
          {props.buttonTitle}
        </Button>
      </Row>
    </>
  );
};

interface ContestInfo {
  title: string;
  memo: string;
  startSecond: number;
  endSecond: number;
  mode: VirtualContestMode;
  problems: List<VirtualContestItem>;
}

interface OuterProps {
  initialProblems: List<VirtualContestItem>;
  pageTitle: string;
  initialTitle: string;
  initialMemo: string;
  initialStartDate: string;
  initialStartHour: number;
  initialStartMinute: number;
  initialEndDate: string;
  initialEndHour: number;
  initialEndMinute: number;
  initialMode: VirtualContestMode;

  buttonPush: (contest: ContestInfo) => void;
  buttonTitle: string;
}

interface InnerProps extends OuterProps {
  problemMapFetch: PromiseState<Map<ProblemId, Problem>>;
  loginState: PromiseState<{} | null>;
}

export default connect<OuterProps, InnerProps>(() => ({
  problemMapFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemMap()
  },
  loginState: {
    url: USER_GET
  }
}))(ContestConfig);

const toUnixSecond = (date: string, hour: number, minute: number) => {
  const hh = hour < 10 ? "0" + hour : "" + hour;
  const mm = minute < 10 ? "0" + minute : "" + minute;
  const s = `${date}T${hh}:${mm}:00+09:00`;
  return moment(s).unix();
};
