import styled from "styled-components";

const CageOverlay = styled.div`
  position: absolute;
  border: 2px dashed #000;
  pointer-events: none;
`;

const SumLabel = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 12px;
  background: #fff;
  padding: 0 4px;
`;

function Cage({ cells, sum }) {
  const rows = cells.map((idx) => Math.floor(idx / 9));
  const cols = cells.map((idx) => idx % 9);
  const top = Math.min(...rows) * 40;
  const left = Math.min(...cols) * 40;
  const height = (Math.max(...rows) - Math.min(...rows) + 1) * 40;
  const width = (Math.max(...cols) - Math.min(...cols) + 1) * 40;

  return (
    <CageOverlay
      style={{
        top: `${top}px`,
        left: `${left}px`,
        height: `${height}px`,
        width: `${width}px`,
      }}
    >
      <SumLabel>{sum}</SumLabel>
    </CageOverlay>
  );
}

export default Cage;
