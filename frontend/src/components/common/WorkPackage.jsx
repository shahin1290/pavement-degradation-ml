import React from 'react';

function WorkPackage({
  number,
  title,
  text
}) {

  return (

    <div className="wp-card">

      <div className="wp-number">
        {number}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>

      </div>

    </div>

  );
}

export default WorkPackage;