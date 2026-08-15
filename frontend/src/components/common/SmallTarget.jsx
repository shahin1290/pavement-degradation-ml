import React from 'react';

function SmallTarget({
  title,
  value
}) {

  return (

    <div className="small-target">

      <strong>
        {title}
      </strong>

      <div>
        {value}
      </div>

    </div>

  );
}

export default SmallTarget;