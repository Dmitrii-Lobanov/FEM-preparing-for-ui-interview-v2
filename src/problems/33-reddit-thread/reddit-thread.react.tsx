import css from './reddit-thread.module.css'
import flex from '@course/styles'
import cx from '@course/cx'

export interface IRedditComment {
  id: string
  nickname: string
  text: string
  date: string
  replies: IRedditComment[]
}

/**
 * Expected data sample:
 * {
 *   comments: [
 *     {
 *       id: "1",
 *       nickname: "user123",
 *       text: "This is a top-level comment",
 *       date: "2024-01-15",
 *       replies: [
 *         {
 *           id: "2",
 *           nickname: "replier456",
 *           text: "This is a nested reply",
 *           date: "2024-01-16",
 *           replies: []
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Step 1: Create a RedditComment component that renders a single comment
 * - Render an <article> with css.comment and flex.padding16
 * - <header> with flex.flexRowBetween: <strong> for nickname, <time> for date
 * - <p> for comment text with padding classes
 *
 * Step 2: Handle nested replies recursively
 * - If comment.replies.length > 0, render a <details>/<summary> toggle
 * - Inside <details>, render a <ul> with each reply as a <li>
 * - Recursively render <RedditComment> for each reply
 *
 * Step 3: Create RedditThreadComponent that maps over top-level comments
 * - Wrap in a container div with css.container and flex.wh100
 * - Map over comments array, rendering <RedditComment> for each
 */
export const RedditThread = ({ comments }: { comments: IRedditComment[] }) => {
  console.log(comments)

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id} className={cx(css.comment)}>
          <section className={cx(flex.flexRowBetween)}>
            <div className={cx(css.nickname)}>{comment.nickname}</div>
            <div className={cx(css.date)}>{comment.date}</div>
          </section>

          <section>{comment.text}</section>
          <RedditComment {...comment} />
        </li>
      ))}
    </ul>
  )
}

function RedditComment(comment: IRedditComment) {
  if (!comment.id) return null;

  return (
    <details className={cx(css.details)}>
      <summary className={cx(css.summary)}>Replies</summary>
        <ul className={cx(css.repliesList)}>
          {comment.replies.map((reply) => (
            <li key={reply.id} className={cx(css.comment)}>
              <section className={cx(flex.flexRowBetween)}>
                <div className={cx(css.nickname)}>{reply.nickname}</div>
                <div className={cx(css.date)}>{reply.date}</div>
              </section>

              <section>{reply.text}</section>
            </li>
          ))}
        </ul>
    </details>
  )
}
