import React from 'react';

function Variable({
  name,
  symbol,
  description
}) {

  return (

    <div className="variable-item">

      <div className="variable-header">

        <strong>
          {name}
        </strong>

        <span className="variable-symbol">
          {symbol}
        </span>

      </div>

      <div className="variable-description">
        {description}
      </div>

    </div>

  );
}

export default Variable;