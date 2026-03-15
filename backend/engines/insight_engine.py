import os
import anthropic

# Assuming the ANTHROPIC_API_KEY is available in the environment variables
client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

async def generate_weekly_insight(request_data) -> str:
    avg_sleep_min = request_data.avg_sleep_minutes
    sleep_hours = f"{(avg_sleep_min / 60):.1f}" if avg_sleep_min else "unknown"
    
    if request_data.recent_moods:
        avg_mood = sum(m.get('mood', 0) for m in request_data.recent_moods) / len(request_data.recent_moods)
        avg_energy = sum(m.get('energy', 0) for m in request_data.recent_moods) / len(request_data.recent_moods)
        mood_summary = f"Average mood {avg_mood:.1f}/5, average energy {avg_energy:.1f}/5"
    else:
        mood_summary = "No mood data yet"

    prompt = f"""You are a warm, clinically-informed postpartum recovery assistant inside a Recovery & Wellbeing tracker.

Mother's current data:
- Week postpartum: {request_data.week_number} of 12
- Delivery type: {request_data.delivery_type}
- Average sleep last 7 days: {sleep_hours} hours/night
- Sleep fragmentation: {'Yes — heavily fragmented' if request_data.sleep_fragmented else 'No major fragmentation'}
- Milestones completed: {request_data.completed_milestones} of {request_data.total_milestones} available this week
- Custom activities logged: {request_data.custom_log_count} this week
- {mood_summary}
- Check-in streak: {request_data.checkin_streak} days

Write a personalized weekly insight in 3 short sections:

**This week for your body** (2–3 sentences about what's physically happening)
**This week for your mind** (2–3 sentences about the emotional landscape of Week {request_data.week_number})
**Your one thing** (one specific, achievable action for this week)

Tone: warm, honest, non-patronizing. Like a knowledgeable friend, not a pamphlet. No excessive exclamation marks. Be real about difficult moments without being alarming. Max 200 words total."""

    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=400,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text
    except Exception as e:
        print(f"Error generating insight: {e}")
        return "Unable to generate insight at this time."
