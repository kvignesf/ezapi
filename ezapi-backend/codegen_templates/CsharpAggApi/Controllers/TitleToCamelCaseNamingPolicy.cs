using System.Text.Json;

namespace CNKTOPROJNMTMP.Controllers
{
    public class TitleToCamelCaseNamingPolicy : JsonNamingPolicy
    {
        public override string ConvertName(string name)
        {
            Console.WriteLine("name in the call.." + name);
            
            // Custom logic to convert title case to camel case
            if (string.IsNullOrEmpty(name) || !char.IsUpper(name[0]))
                return name;

            char[] charArray = name.ToCharArray();

            for (int i = 0; i < charArray.Length; i++)
            {
                bool hasNext = i + 1 < charArray.Length;
                if (i > 0 && hasNext && !char.IsUpper(charArray[i + 1]))
                {
                    charArray[i] = char.ToLower(charArray[i]);
                    break;
                }

                charArray[i] = char.ToLowerInvariant(charArray[i]);
            }

            return new string(charArray);
        }
    }
}
