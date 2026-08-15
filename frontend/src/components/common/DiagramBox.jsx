import React from 'react';

function DiagramBox({
  title,
  children
}) {

  return (

    <div className="diagram-box">

      <strong>
        {title}
      </strong>

      <div className="diagram-content">
        {children}
      </div>

    </div>

  );
}

export default DiagramBox;