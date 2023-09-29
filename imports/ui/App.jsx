import { Meteor } from "meteor/meteor";
import React, { useState, Fragment, Suspense } from "react";
import { useTracker } from "meteor/react-meteor-data/suspense";
import { TasksCollection } from "/imports/api/TasksCollection";
import { Task } from "./Tasks";
import { TaskForm } from "./TaskForm";
import { LoginForm } from "./LoginForm";

const toggleChecked = async ({ _id, isChecked }) => {
  await TasksCollection.updateAsync(_id, {
    $set: {
      isChecked: !isChecked,
    },
  });
};

const deleteTask = async ({ _id }) => await TasksCollection.removeAsync(_id);

const Main = () => {
  const user = useTracker("user", async () => await Meteor.user());
  const [hideCompleted, setHideCompleted] = useState(false);

  const hideCompletedFilter = { isChecked: { $ne: true } };

  const userFilter = user ? { userId: user._id } : {};

  const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

  const pendingTasksCount = useTracker("pendingTasksCount", async () => {
    if (!user) {
      return 0;
    }

    return await TasksCollection.find(pendingOnlyFilter).countAsync();
  });

  const pendingTasksTitle = `${
    pendingTasksCount ? ` (${pendingTasksCount})` : ""
  }`;

  const tasks = useTracker("tasks", async () => {
    if (!user) {
      return [];
    }

    return await TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter,
      {
        sort: { createdAt: -1 },
      }
    ).fetchAsync();
  });

  const logout = () => Meteor.logout();

  return (
    <div className="main">
      {user ? (
        <Fragment>
          <div className="user" onClick={logout}>
            {user.username} 🚪
          </div>
          <TaskForm user={user} />

          <div className="filter">
            <button onClick={() => setHideCompleted(!hideCompleted)}>
              {hideCompleted ? "Show All" : "Hide Completed"}
            </button>
          </div>

          <ul className="tasks">
            {tasks.map((task) => (
              <Task
                key={task._id}
                task={task}
                onCheckboxClick={toggleChecked}
                onDeleteClick={deleteTask}
              />
            ))}
          </ul>
        </Fragment>
      ) : (
        <LoginForm />
      )}
    </div>
  );
};

export const App = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Main />
      </Suspense>
    </div>
  );
};
