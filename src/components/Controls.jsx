import styled from "styled-components";

const ControlButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

function Controls({ onNewGame }) {
  return (
    <ControlButtons>
      <button
        onClick={onNewGame}
        style={{
          padding: "10px",
          background: "#1e90ff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        New Game
      </button>
      <button
        style={{
          padding: "10px",
          background: "#ccc",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Undo
      </button>
      <button
        style={{
          padding: "10px",
          background: "#ccc",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Pencil
      </button>
      <button
        style={{
          padding: "10px",
          background: "#ccc",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Hint
      </button>
    </ControlButtons>
  );
}

export default Controls;
