import { FunctionComponent } from 'react';

import ICell from '../../cells/ICell';
import useCell from '../../cells/useCell';
import Button from '../../components/Button';

export const Counter: FunctionComponent<{
  label: string;
  cell: ICell<number>;
}> = ({ label, cell }) => {
  const value = useCell(cell);

  if (value === undefined) {
    return <></>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
      <div>{label}: </div>
      <Button
        className="btn-secondary"
        onPress={() => value !== undefined && cell.write(value - 1)}
      >
        -
      </Button>
      <div>{value}</div>
      <Button
        className="btn-secondary"
        onPress={() => value !== undefined && cell.write(value + 1)}
      >
        +
      </Button>
    </div>
  );
};